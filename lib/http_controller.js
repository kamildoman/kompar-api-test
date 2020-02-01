// @ts-check

'use strict';

class Methods {
    constructor() {
        this.GET = "GET";
        this.POST = "POST";
    }
}

class Access_Control_Allow {
    constructor() {
        this.Origin = "Access-Control-Allow-Origin";
        this.Methods = "Access-Control-Allow-Methods";
        this.Headers = "Access-Control-Allow-Headers";
    }
}

class Content_Type {
    constructor() {
        this.name = "content-type";
        this.Application_X_www_form_urlencoded = "application/x-www-form-urlencoded";
        this.Application_JSON = "application/json";
    }
}

class Authorization {
    constructor() {
        this.name = "authorization";
        this.Basic = "Basic";
    }
}

class Accept {
    constructor() {
        this.name = "Accept";
    }
}

class Ocp_Apim_Subscription_Key {
    constructor() {
        this.name = "Ocp-Apim-Subscription-Key";
    }
}

class Headers {
    /**
     * @param {Access_Control_Allow} access_control_allow
     * @param {Content_Type} content_type
     * @param {Authorization} authorization
     * @param {Accept} accept
     * @param {Ocp_Apim_Subscription_Key} ocp_apim_subscription_key
     */
    constructor(access_control_allow, content_type, authorization, accept, ocp_apim_subscription_key) {
        this.access_control_allow = access_control_allow;
        this.content_type = content_type;
        this.authorization = authorization;
        this.accept = accept;
        this.ocp_apim_subscription_key = ocp_apim_subscription_key;
    }
}

class Statuses {
    constructor() {
        this.OK = 200;
        this.BAD_REQUEST = 400,
        this.UNAUTHORIZED = 401,
        this.NOT_FOUND = 404
    }
}

class Http_controller {
    /**
     * @param {Methods} methods
     * @param {Headers} headers
     * @param {Statuses} statuses
     */
    constructor(methods, headers, statuses) {
        this.methods = methods;
        this.headers = headers;
        this.statuses = statuses;
    }
}

const headers = new Headers(new Access_Control_Allow(), new Content_Type(), new Authorization(), new Accept(), new Ocp_Apim_Subscription_Key());
const http_controller = new Http_controller(new Methods(), headers, new Statuses());

module.exports = http_controller;