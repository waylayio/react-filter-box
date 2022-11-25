import * as CodeMirror from "codemirror";
import * as _ from "lodash";
import {
  HintResult,
  HintFunc,
  HintOptions,
  ExtendedCodeMirror,
  Completion,
  HintInfo,
} from "./models/ExtendedCodeMirror";
import grammarUtils from "./GrammarUtils";
import * as ReactDOM from "react-dom";
import * as React from "react";
import FilterQueryParser from "./FilterQueryParser";

export default class AutoCompletePopup {
  doc: CodeMirror.Doc;
  hintOptions: HintOptions;
  completionShow = false;
  valueWasSelected = false;
  appendSpace = true;
  customRenderCompletionItem: (
    self: HintResult,
    data: Completion,
    registerAndGetPickFunc: () => PickFunc,
    currentCursor,
    query
  ) => React.ReactElement<any>;
  pick: (cm: ExtendedCodeMirror, self: HintResult, data: Completion) => string;

  parser = new FilterQueryParser();

  constructor(
    private cm: ExtendedCodeMirror,
    private needAutoCompletevalues: (text: string) => HintInfo[]
  ) {
    this.doc = cm.getDoc();

    cm.on("endCompletion", () => {
      this.completionShow = false;
    });

    this.hintOptions = this.createHintOption();
  }

  private processText(value: string | Object): any | Object {
    if (!_.isString(value)) {
      return value;
    }
    if (grammarUtils.needSpaceAfter(value as string)) {
      return value + " ";
    }

    return value;
  }

  private onPick(cm: ExtendedCodeMirror, self: HintResult, data: Completion) {
    var value = data.value;
    if (this.pick) {
      value = this.pick(cm, self, data);
    }

    if (typeof value !== "string") {
      return;
    }
    cm.replaceRange(this.processText(value), self.from, self.to, "complete");
    this.valueWasSelected = true;
  }

  private renderHintElement(element: any, self: HintResult, data: Completion) {
    var div = document.createElement("div");
    var className = ` hint-value cm-${data.type}`;
    var registerAndGetPickFunc = () => {
      //hack with show-hint code mirror https://github.com/codemirror/CodeMirror/blob/master/addon/hint/show-hint.js
      // to prevent handling click event
      element.className += " custom";
      setTimeout(() => {
        element.hintId = null;
      }, 0);

      return this.manualPick.bind(this, self, data);
    };

    if (this.customRenderCompletionItem) {
      const query = this.parser.parse(this.doc.getValue());
      const cursor = this.doc.getCursor();
      ReactDOM.render(
        this.customRenderCompletionItem(
          self,
          data,
          registerAndGetPickFunc,
          cursor,
          query
        ),
        div
      );
    } else {
      ReactDOM.render(<div className={className}>{data.value as any}</div>, div);
    }

    element.appendChild(div);
  }

  private manualPick(self: HintResult, data: Completion, value: string) {
    var completionControl = this.cm.state.completionActive;
    if (completionControl == null) return;

    var index = self.list.indexOf(data);
    data.hint = (
      cm: ExtendedCodeMirror,
      self: HintResult,
      data: Completion
    ) => {
      cm.replaceRange(this.processText(value), self.from, self.to, "complete");
    };
    completionControl.pick(self, index);
  }

  private buildComletionObj(info: HintInfo): Completion {
    return {
      value: info.value,
      type: info.type,
      hint: this.onPick.bind(this),
      render: this.renderHintElement.bind(this),
    };
  }

  private findLastSeparatorPositionWithEditor() {
    var doc = this.cm.getDoc();
    var currentCursor = doc.getCursor();
    var text = doc.getRange({ line: 0, ch: 0 }, currentCursor);
    var index = grammarUtils.findLastSeparatorIndex(text);
    return {
      line: currentCursor.line,
      ch: currentCursor.ch - (text.length - index) + 1,
    };
  }

  show() {
    var cursor = this.doc.getCursor();
    var text = this.doc.getRange({ line: 0, ch: 0 }, cursor);
    this.hintOptions.hintValues = this.needAutoCompletevalues(text);

    this.cm.showHint(this.hintOptions);
    this.completionShow = true;
  }

  private createHintOption() {
    var hintOptions = new HintOptions();

    hintOptions.hint = (() => {
      var { hintValues } = hintOptions;
      var doc = this.cm.getDoc();
      var cursor = doc.getCursor();
      var lastSeparatorPos = this.findLastSeparatorPositionWithEditor();
      var text = doc.getRange(lastSeparatorPos, cursor);

      var values = hintValues;
      if (text) {
        values = _.filter(hintValues, (f) => {
          var value = f.value as string;
          return _.isString(f.value)
            ? _.startsWith(value.toLowerCase(), text.toLowerCase())
            : true;
        });
      }

      const indexOfParanthesis = values.findIndex((el) => el.value === "(");
      if (indexOfParanthesis >= 0) {
        values.splice(indexOfParanthesis, 1);
      }
      const newValues = values.filter((el) => el.value !== undefined);
      return {
        list: _.map(newValues, (c) => this.buildComletionObj(c)),
        from: lastSeparatorPos,
        to: cursor,
      };
    }) as HintFunc;

    hintOptions.hint.supportsSelection = true;

    return hintOptions;
  }
}

interface PickFunc {
  (): void;
}
