"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourcingModule = void 0;
const core_1 = require("@nitrostack/core");
const sourcing_tools_js_1 = require("./sourcing.tools.js");
let SourcingModule = class SourcingModule {
};
exports.SourcingModule = SourcingModule;
exports.SourcingModule = SourcingModule = __decorate([
    (0, core_1.Module)({
        name: 'SourcingModule',
        controllers: [sourcing_tools_js_1.SourcingTools],
        providers: [sourcing_tools_js_1.SourcingTools],
        exports: [sourcing_tools_js_1.SourcingTools],
    })
], SourcingModule);
//# sourceMappingURL=sourcing.module.js.map