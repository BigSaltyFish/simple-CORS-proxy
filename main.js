let http = require('http');
let queryString = require('querystring');
let fs = require('fs');

// the header fields in the request
// set 'withCredentials' to true if cookies are needed
const allowHeaders = [
    'X-CSRFtoken',
    'content-type',
    'withCredentials'
];

// the methods need CORS
const allowMethods = [
    'GET',
    'POST'
];

const serverOrigin = 'http://127.0.0.1:8000';

const PROXY_PORT = 2333;

http.createServer(function(request, response) {
    if(request.method === 'OPTIONS') {
        optionsHandler(request, response);
    }
    else {
        forwardingHandler(request, response);
    }
}).listen(PROXY_PORT);

function optionsHandler(request, response) {
    response.writeHead(200, {
        'Access-Control-Allow-Origin': request.headers.origin,
        'Access-Control-Allow-Methods': allowMethods.join(', '),
        'Access-Control-Expose-Headers': 'x-csrftoken, Set-Cookie',
        'Access-Control-Allow-Headers': allowHeaders.join(', '),
        'Access-Control-Allow-Credentials': 'true'
    });
    response.end();
}

function forwardingHandler(request, response) {
    // the buffer to store the request body. used only to log it for the data chunk is sent to the server immediately when they arrived.
    let requestBody = [];
    // the forwarding body type is the same as the original request body type
    let requestBodyType = null;
    if (request.headers['content-type']) requestBodyType = request.headers['content-type'].toString().split(';')[0];

    // the forwarding method
    let forwarding = http.request(serverOrigin + request.url, {headers: request.headers, method: request.method}, function (res) {
        let proxyResponseHeaders = res.headers;
        proxyResponseHeaders['Access-Control-Expose-Headers'] = 'x-csrftoken, Set-Cookie';
        proxyResponseHeaders['Access-Control-Allow-Origin'] = request.headers.origin;
        proxyResponseHeaders['Access-Control-Allow-Methods'] = allowMethods.join(', ');
        proxyResponseHeaders['Access-Control-Allow-Headers'] = allowHeaders.join(', ');
        proxyResponseHeaders['Access-Control-Allow-Credentials'] = 'true';
        response.writeHead(200, proxyResponseHeaders);

        let responseBody = '';
        res.on('data', function (chunk) {
            responseBody += chunk
        });
        res.on('end', function () {
            if(responseBody.length < 2000) {
                console.log(`the response body: ${responseBody}`);
            }
            console.log('\n');
            response.write(responseBody);
            responseBody = '';
            response.end();
        })
    });

    request.on('data', function (data) {
        requestBody.push(data);
        forwarding.write(data);
    });

    request.on('end', function () {
        let params = Buffer.concat(requestBody);

        console.log(`the request url: ${request.url}`);
        if(requestBodyType === 'application/json') {
            console.log(params.toString());
        }
        else console.log(params.toString());
        forwarding.end();
    });
}
