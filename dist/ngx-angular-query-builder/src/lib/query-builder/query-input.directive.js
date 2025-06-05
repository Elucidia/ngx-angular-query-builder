import { __decorate } from "tslib";
import { Directive, Input } from "@angular/core";
let QueryInputDirective = class QueryInputDirective {
    /** Unique name for query input type. */
    get queryInputType() {
        return this._type;
    }
    set queryInputType(value) {
        // If the directive is set without a type (updated programatically), then this setter will
        // trigger with an empty string and should not overwrite the programatically set value.
        if (!value) {
            return;
        }
        this._type = value;
    }
    constructor(template) {
        this.template = template;
    }
};
__decorate([
    Input()
], QueryInputDirective.prototype, "queryInputType", null);
QueryInputDirective = __decorate([
    Directive({ selector: "[queryInput]" })
], QueryInputDirective);
export { QueryInputDirective };
//# sourceMappingURL=query-input.directive.js.map