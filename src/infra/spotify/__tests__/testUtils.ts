/**
 * Return a response with body: response, statusCode: 200, and headers: record<string, string> from
 * a raw response
 * @param {T} response
 * @return {{headers: {some: string}, body: T, statusCode: number}}
 */
export const makeOkayResponseFromRawResponse = <T>(response: T) => ({
    body: response,
    statusCode: 200,
    headers: {
        some: "header"
    }
});


export const makeErrorReponseFromRawResponse = <T>(msg = "some error message", statusCode = 401) => ({
    body: {
        error: {
            message: msg,
            status: statusCode,
        }
    },
    message: msg,
    statusCode: statusCode,
    headers: {
        some: "header"
    }
});



