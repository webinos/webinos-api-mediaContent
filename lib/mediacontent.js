/*******************************************************************************
*  Code contributed to the webinos project
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*  
*     http://www.apache.org/licenses/LICENSE-2.0
*  
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* Copyright 2012 Habib Virji, Samsung Electronics (UK) Ltd
 ******************************************************************************/
(function () {
  "use strict";

  var send = require("send");
  var url = require("url");
  var uuid = require("node-uuid");
  var RPCWebinosService = require('webinos-jsonrpc2').RPCWebinosService;

  var WebinosMediaContentService, WebinosMediaContentModule, mediaContentImpl, Thumbs;
  if (process.platform == 'android') {
      mediaContentImpl = require('./mediacontent_android.js');
  } else {
      mediaContentImpl = require('./mediacontent_mediainfo.js');
      Thumbs = require('./thumbs.js').Thumbs;
  }

  WebinosMediaContentModule = function (rpc, params, config) {
      this.rpc = rpc;
      this.params = params;
      this.config = config;
      this.links = {};

      if(Thumbs){
        this.thumbs = new Thumbs(config);
      }

      this.httpHandler = (function (request, response) {

          var ref = url.parse(request.url, true).query["ref"];
          if (ref) {
              send(request, this.links[ref]).pipe(response);
          } else {
              var filePath = url.parse(request.url, true).query["filePath"];
              filePath = (this.thumbs)?this.thumbs.getThumbLocalPath(filePath):"";
              if(filePath){
                send(request, filePath).pipe(response);
              }else{
                response.writeHead(404, "404 Not Found");
                response.end();
              }
          }
      }).bind(this);
  };

  WebinosMediaContentModule.prototype.init = function (register, unregister) {
      register(new WebinosMediaContentService(this.rpc, this.params, this.config, this.links, this.thumbs));
  };

  var WebinosMediaContentService = function (rpcHandler, params, config, links, thumbs) {
      // inherit from RPCWebinosService
      this.base = RPCWebinosService;
      this.base({
          api: 'http://webinos.org/api/mediacontent',
          displayName: 'MediaContent',
          description: 'MediaContent Module to view and get details about image/video/audio.'
      });

      this.rpcHandler = rpcHandler;
      this.params = params;
      this.config = config;
      this.links = links;
      this.thumbs = thumbs;
  };

  WebinosMediaContentService.prototype = new RPCWebinosService;

  WebinosMediaContentService.prototype.updateItem = function (params, successCB, errorCB, item) {
      mediaContentImpl.updateItem(params, successCB, errorCB, item);
  };

  WebinosMediaContentService.prototype.updateItemsBatch = function (params, successCB, errorCB, items) {
      mediaContentImpl.updateItemsBatch(params, successCB, errorCB, items);
  };

  WebinosMediaContentService.prototype.getLocalFolders = function (params, successCB, errorCB) {
      mediaContentImpl.getLocalFolders(params, successCB, errorCB);
  };

  WebinosMediaContentService.prototype.findItem = function (params, successCB, errorCB) {
      if(this.thumbs){
        mediaContentImpl.findItem(params, this.thumbs, successCB, errorCB);
      }else{
        mediaContentImpl.findItem(params, successCB, errorCB);
      }
  };

  WebinosMediaContentService.prototype.getContents = function (params, successCB, errorCB, objectRef) {
      var self = this;
      //params.type, params.fileName
      function success(mediaContents) {
          var MediaType = require("./media_types.js");
          var fs = require("fs");
          var media = new MediaType.Media(), readStream, rpc, buf = [];
          media = mediaContents;
          readStream = fs.createReadStream(media.itemURI);
          readStream.on("data", function (data) {
              buf.push(data);
          });
          readStream.on("end", function (data) {
              var complete_image = Buffer.concat(buf);
              media.contents = complete_image.toString("base64");
              rpc = self.rpcHandler.createRPC(objectRef, 'onEvent', media);
              self.rpcHandler.executeRPC(rpc);
              readStream.destroy();
          });
      }
      this.findItem(params, success, errorCB);
  };

  WebinosMediaContentService.prototype.getLink = function (params, successCallback, errorCallback) {
      var self = this;
      mediaContentImpl.findItem(params, function (item) {
          var ref = uuid.v4();
          self.links[ref] = item.itemURI;
          var link = url.format(
              { protocol : "http"
              , hostname : self.config.http.hostname
              , port : self.config.http.port
              , pathname : "/module/webinos-api-mediacontent/link"
              , query : { "ref" : ref }
              });
          successCallback(link);
      }, errorCallback);
  };

  // export our object
  exports.Module = WebinosMediaContentModule;
}());
