import * as React from "react";
import * as CodeMirror from "codemirror";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/display/placeholder";
import "./FilterMode";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/hint/show-hint.css";
import { UnControlled as ReactCodeMirror } from "react-codemirror2";
import grammarUtils from "./GrammarUtils";
import { ExtendedCodeMirror } from "./models/ExtendedCodeMirror";
import AutoCompletePopup from "./AutoCompletePopup";

export default class FilterInput extends React.Component<any, any> {
  options: CodeMirror.EditorConfiguration;
  codeMirror: ExtendedCodeMirror;
  doc: CodeMirror.Doc;
  autoCompletePopup: AutoCompletePopup;

  public static defaultProps: any = {
    onBlur: () => {},
    onFocus: () => {},
    editorConfig: {},
  };

  constructor(props: any) {
    super(props);

    if (props.editorConfig) {
      this.options = {
        ...props.editorConfig,
        mode: "filter-mode",
      };
    }
  }

  findLastSeparatorPositionWithEditor() {
    var doc = this.codeMirror.getDoc();
    var currentCursor = doc.getCursor();
    var text = doc.getRange({ line: 0, ch: 0 }, currentCursor);
    var index = grammarUtils.findLastSeparatorIndex(text);
    return {
      line: currentCursor.line,
      ch: currentCursor.ch - (text.length - index) + 1,
    };
  }

  private handleFocusOrEmptyText() {
    const doc = this.codeMirror.getDoc();
    const currentCursor = doc.getCursor();
    const text = doc.getRange({ line: 0, ch: 0 }, currentCursor);
    if (
      this.autoCompletePopup.completionShow ||
      text === "" ||
      !this.codeMirror.state.focused
    ) {
      return;
    }
    this.autoCompletePopup.show();
  }

  private onSubmit(text: string) {
    if (this.props.onSubmit) {
      this.props.onSubmit(text);
    }
  }

  private codeMirrorRef(ref: { editor: ExtendedCodeMirror }) {
    if (ref == null) return;
    if (this.codeMirror == ref.editor) {
      return;
    }

    this.codeMirror = ref.editor;
    this.doc = ref.editor.getDoc();
    this.autoCompletePopup = new AutoCompletePopup(this.codeMirror, (text) => {
      return this.props.needAutoCompleteValues(this.codeMirror, text);
    });

    this.autoCompletePopup.customRenderCompletionItem =
      this.props.customRenderCompletionItem;
    this.autoCompletePopup.pick = this.props.autoCompletePick;

    ref.editor.on("beforeChange", function (instance, change) {
      // remove new lines
      const newtext = change.text.join("").replace(/\n/g, "");
      // if the change came from undo/redo, `update` is undefined and the change cannot be modified. */
      if (typeof change.update === "function") {
        change.update(change.from, change.to, [newtext] as any);
      }
      return true;
    });

    ref.editor.on("changes", () => {
      this.handleFocusOrEmptyText();
    });

    ref.editor.on("focus", (cm, e?: any) => {
      this.handleFocusOrEmptyText();
      this.props.onFocus(e);
    });

    ref.editor.on("blur", (cm, e?: any) => {
      // this.onSubmit(this.doc.getValue());
      this.props.onBlur(e);
    });

    ref.editor.on("keyup", (cm: ExtendedCodeMirror, e?: KeyboardEvent) => {
      if (!this.autoCompletePopup.valueWasSelected) {
        if (e.code == "Enter") {
          this.onSubmit(this.doc.getValue());
        }
      } else {
        this.autoCompletePopup.valueWasSelected = false;
      }
    });
  }

  private handleEditorChange(
    _editor: any,
    _data: CodeMirror.EditorChange,
    value: string
  ) {
    this.props.onChange(value);
  }

  render() {
    return (
      //@ts-ignore
      <ReactCodeMirror
        ref={this.codeMirrorRef.bind(this)}
        onChange={this.handleEditorChange.bind(this)}
        options={{
          ...this.options,
          readOnly: this.props.readOnly ? "nocursor" : false,
        }}
        value={this.props.value}
      />
    );
  }
}
