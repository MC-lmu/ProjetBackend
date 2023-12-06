
const kBadRequest = 0;
const kNotFound = 1;
const kServerError = 2;

const kHttpError = 99;  //Reserved for raw HTTP errors

const kHttpErrorFlag = 0x1000;
const kHttpErrorMask = 0x0FFF;

class ExtError extends Error {
    constructor(kind, message, baseError = undefined) {
        super(message);

        if ((kind & kHttpErrorFlag) != 0) {
            this.kind = kHttpError;
            this.statusCode = (this.kind & kHttpErrorMask);
        } else {
            this.kind = kind;
        }
        this.baseError = baseError;

        //Needed when extending a built-in class
        Object.setPrototypeOf(this, ExtError.prototype);
        Error.captureStackTrace(this, ExtError.constructor);
    }

    getStatusCode() {
        return (this.kind === kHttpError)
            ? this.httpStatusCode
            : undefined;
    }
}

exports.ExtError = ExtError;

exports.ErrorKinds = {
    kBadRequest,
    kNotFound,
    kServerError,
    kHttpError //For internal usage
};

exports.BadRequestError = function(message, baseError) {
    return new ExtError(kBadRequest, message, baseError);
}

exports.NotFoundError = function(message, baseError) {
    return new ExtError(kNotFound, message, baseError);
}

exports.ServerError = function(message, baseError) {
    return new ExtError(kServerError, message, baseError);
}

exports.HttpError = function(statusCode, message) {
    return new ExtError(kHttpErrorFlag | (statusCode & kHttpErrorMask), message);
}
