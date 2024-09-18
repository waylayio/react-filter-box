import * as React from "react";
import { countBy } from "lodash";
import FilterInput from "./FilterInput";
import SimpleResultProcessing from "./SimpleResultProcessing";

import GridDataAutoCompleteHandler, {
  Option,
} from "./GridDataAutoCompleteHandler";
import Expression from "./Expression";
import FilterQueryParser from "./FilterQueryParser";
import BaseResultProcessing from "./BaseResultProcessing";
import BaseAutoCompleteHandler from "./BaseAutoCompleteHandler";
import ParsedError from "./ParsedError";
import validateQuery from "./validateQuery";

const DOUBLE_QUOTE = '"';
const SPACE = " ";

export default class ReactFilterBox extends React.Component<any, any> {
  public static defaultProps: any = {
    onParseOk: () => {},
    onParseError: () => {},
    onChange: () => {},
    onDataFiltered: () => {},
    autoCompleteHandler: null,
    onBlur: () => {},
    onFocus: () => {},
    editorConfig: {},
    strictMode: false,
    readOnly: false,
  };
  parser = new FilterQueryParser();

  constructor(props: any) {
    super(props);

    var autoCompleteHandler =
      this.props.autoCompleteHandler ||
      new GridDataAutoCompleteHandler(this.props.data, this.props.options);

    this.parser.setAutoCompleteHandler(autoCompleteHandler);

    this.state = {
      isFocus: false,
      isError: false,
    };
    //need onParseOk, onParseError, onChange, options, data
  }

  needAutoCompleteValues(codeMirror: any, text: string) {
    return this.parser.getSuggestions(text);
  }

  onSubmit(query: string) {
    var validationResult = { isValid: true };
    var result = this.parser.parse(query);
    if (this._isFilterableContent(query)) {
      this.setState({ isError: false });
    } else {
      if ((result as ParsedError).isError) {
        return this.props.onParseError(result, { isValid: false });
      } else if (this.props.strictMode) {
        validationResult = validateQuery(
          result as Expression[],
          this.parser.autoCompleteHandler
        );
        if (!validationResult.isValid) {
          return this.props.onParseError(result, validationResult);
        }
      }
    }

    return this.props.onParseOk(result);
  }

  onChange(query: string) {
    var validationResult = { isValid: true };
    var result: any;
    if (this._isFilterableContent(query)) {
      this.setState({ isError: false });
      result = query;
    } else {
      result = this.parser.parse(query);
      if ((result as ParsedError).isError) {
        validationResult = { isValid: false };
        this.setState({ isError: true });
      } else if (this.props.strictMode) {
        validationResult = validateQuery(
          result as Expression[],
          this.parser.autoCompleteHandler
        );
        this.setState({ isError: !validationResult.isValid });
      } else {
        this.setState({ isError: false });
      }
    }

    this.props.onChange(query, result, validationResult);
  }

  _isFilterableContent(query: string) {
    return (
      this._doesNotContainSpaces(query) ||
      this._isEnclosedInDoubleQuotes(query) ||
      (this._doesNotContainDoubleQuotes(query) &&
        this._doesNotContainOperators(query))
    );
  }

  _doesNotContainSpaces(value: string) {
    return value.indexOf(SPACE) === -1;
  }

  _doesNotContainDoubleQuotes(value: string) {
    return value.indexOf(DOUBLE_QUOTE) === -1;
  }

  _isEnclosedInDoubleQuotes(value: string) {
    return (
      value.startsWith(DOUBLE_QUOTE) &&
      value.endsWith(DOUBLE_QUOTE) &&
      countBy(value)[DOUBLE_QUOTE] === 2
    );
  }

  _doesNotContainOperators(query: string) {
    return !this.parser.autoCompleteHandler
      .needOperators()
      .some((operator) =>
        query.toLowerCase().includes(` ${operator.toLowerCase()} `)
      );
  }

  onBlur(event: any) {
    const { onBlur } = this.props;
    this.setState({ isFocus: false });
    if (onBlur) {
      onBlur(event);
    }
  }

  onFocus(event: any) {
    const { onFocus } = this.props;
    if (!this.props.readOnly) {
      this.setState({ isFocus: true });
      if (onFocus) {
        onFocus(event);
      }
    }
  }

  render() {
    var className = "react-filter-box";
    if (this.state.isFocus) {
      className += " focus";
    }
    if (this.state.isError) {
      className += " error";
    }

    return (
      <div className={className}>
        <FilterInput
          autoCompletePick={this.props.autoCompletePick}
          customRenderCompletionItem={this.props.customRenderCompletionItem}
          onBlur={this.onBlur.bind(this)}
          onFocus={this.onFocus.bind(this)}
          value={this.props.query}
          needAutoCompleteValues={this.needAutoCompleteValues.bind(this)}
          onSubmit={this.onSubmit.bind(this)}
          onChange={this.onChange.bind(this)}
          editorConfig={this.props.editorConfig}
          readOnly={this.props.readOnly}
        />
      </div>
    );
  }
}

export {
  SimpleResultProcessing,
  BaseResultProcessing,
  GridDataAutoCompleteHandler,
  BaseAutoCompleteHandler,
  Option as AutoCompleteOption,
  Expression,
};
