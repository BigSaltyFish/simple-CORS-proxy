let http = require('http');
let queryString = require('querystring');
let fs = require('fs');

// the header fields in the request
// set 'withCredentials' to true if cookies needed
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


http.createServer(function(request, response) {
    let requestHeaders = request.headers;
    let requestBody = [];

    if(request.method === 'OPTIONS') {
        response.writeHead(200, {
            'Access-Control-Allow-Origin': requestHeaders.origin,
            'Access-Control-Allow-Methods': allowMethods.join(', '),
            'Access-Control-Expose-Headers': 'x-csrftoken, Set-Cookie',
            'Access-Control-Allow-Headers': allowHeaders.join(', '),
            'Access-Control-Allow-Credentials': 'true'
        });
        response.end();
    }
    else {
        let requestBodyType = requestHeaders['content-type'].toString().split(';')[0];
        request.on('data', function (data) {
            requestBody.push(data)
        });

        request.on('end', function () {
            // console.log(`the request url: ${req.url}`);
            let params = Buffer.concat(requestBody);

            // console.log('the request headers: ');
            // console.log(headers);
            let forwarding = http.request(serverOrigin + request.url, {headers: requestHeaders, method: request.method}, function (res) {
                let proxyResponseHeaders = res.headers;
                // console.log('the response header');
                // console.log(tmpHeaders);
                proxyResponseHeaders['Access-Control-Expose-Headers'] = 'x-csrftoken, Set-Cookie';
                proxyResponseHeaders['Access-Control-Allow-Origin'] = requestHeaders.origin;
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

            console.log(`the request url: ${request.url}`);
            if(requestBodyType === 'application/json') {
                console.log(params.toString());
            }
            else console.log(params.toString());
            forwarding.write(params);
            forwarding.end();
        });
    }
}).listen(2333);
