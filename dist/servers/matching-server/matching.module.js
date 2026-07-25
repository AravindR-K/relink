"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingModule = void 0;
const core_1 = require("@nitrostack/core");
const matching_tools_js_1 = require("./matching.tools.js");
let MatchingModule = class MatchingModule {
};
exports.MatchingModule = MatchingModule;
exports.MatchingModule = MatchingModule = __decorate([
    (0, core_1.Module)({
        name: 'MatchingModule',
        controllers: [matching_tools_js_1.MatchingTools],
        providers: [matching_tools_js_1.MatchingTools],
        exports: [matching_tools_js_1.MatchingTools],
    })
], MatchingModule);
//# sourceMappingURL=matching.module.js.map