/*******************************************************************************
 *    Code contributed to the webinos project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 2013 Fraunhofer FOKUS
 ******************************************************************************/

var xml2js = require('xml2js');
var RPCWebinosService = require('webinos-jsonrpc2').RPCWebinosService;
var MediaType = require("./media_types.js");

var UPnPMediaServerModule = function(register, unregister, rpcHandler, params) {
    if (params && !params.useUPnP) {
        // useUPnP is needs to be true in config.json
        return;
    }

    var servicesMap = {};
    var upnp;
    try {
        upnp = require('peer-upnp');
    } catch(e) {}

    var peer = upnp.createPeer().start();

    peer.on('urn:schemas-upnp-org:service:ContentDirectory:1', function(service) {
        service.bind(function(boundService) {
            var webinosService = new MediaServerService(rpcHandler, params, boundService, service.device);
            servicesMap[service.UDN] = webinosService;
            register(webinosService);

            service.on('disappear', function(vanishedService) {
                var origWebinosSv = servicesMap[vanishedService.UDN];
                if (origWebinosSv) {
                    console.log('unregistering', origWebinosSv.displayName);
                    unregister(origWebinosSv);
                    delete servicesMap[vanishedService.UDN];
                }
            });
        });
    });
};

var MediaServerService = function (rpcHandler, params, service, device) {
    // inherit from RPCWebinosService
    this.base = RPCWebinosService;
    this.rpcHandler = rpcHandler;
    this.base({
        api: 'http://webinos.org/api/mediacontent',
        displayName: 'MediaContent UPnP - ' + device.modelName,
        description: 'webinos MediaContent API, UPnP MediaServer - ' + device.modelDescription
    });

    var _service = service;

    var isErr = function(res) {
        return res && res.name && res.name === 'UPnPError' ? true : false;
    };

    var getMediaType = function(path) {
        if (!path) return MediaType.MediaItemType.UNKNOWN;

        var ex = path.substr(-3);
        if (ex === 'jpg' || ex === 'peg' || ex === 'png') return MediaType.MediaItemType.IMAGE;
        if (ex === 'avi' || ex === 'mp4' || ex === 'mov' || ex === 'mkv') return MediaType.MediaItemType.VIDEO;
        if (ex === 'mp3' || ex === 'off' || ex === 'lac' || ex === 'm4a') return MediaType.MediaItemType.AUDIO;
        return MediaType.MediaItemType.UNKNOWN;
    };

    var getMimeType = function(info) {
        if (!info) return '';

        return info.match(/(?:image|video|audio)\/[^:]+/) || '';
    };

    var parseBrowseResponse = function(res, successCB, errorCB) {
        xml2js.parseString(res,{mergeAttrs: true, explicitArray: false, ignoreXmlns: true, ignoreAttrs: false},function(err,json){
            if (err) {
                errorCB(err);
                return;
            }

            var parsed = json['DIDL-Lite'];
            var items = [];
            if (parsed.container) {
                if (!parsed.container.length) {
                    parsed.container = [parsed.container];
                }
                parsed.container.forEach(function(item) {
                    var mediaFolder = new MediaType.MediaFolder();
                    mediaFolder.id = item.id;
                    mediaFolder.folderURI = ''; // TODO
                    mediaFolder.title = item.title;
                    mediaFolder.storageType = MediaType.MediaFolderType.UNKNOWN;
                    mediaFolder.modifiedDate = new Date(0); // TODO

                    if (item.id.substr(0, item.parentID.length) !== item.parentID) {
                        items.push(mediaFolder);
                    }
                });
            } else if (parsed.item) {
                if (!parsed.item.length) {
                    parsed.item = [parsed.item];
                }
                parsed.item.forEach(function(item) {
                    var mediaItem = new MediaType.MediaItem();
                    mediaItem.id = item.id;
                    mediaItem.type = getMediaType(item.res['_']);
                    mediaItem.mimeType = getMimeType(item.res.protocolInfo);
                    mediaItem.title = item.title;
                    mediaItem.itemURI = item.res['_'];
                    mediaItem.thumbnailURIs = [item.icon];
                    mediaItem.releaseDate = new Date(item.date);
                    mediaItem.modifiedDate = new Date(item.date);
                    mediaItem.size = 0;
                    mediaItem.description = '';
                    mediaItem.rating = '';
//                    if (current.track && current.track[1] && current.track[1].$["type"] === "Audio") {
//                      mediaItem.album = (track.Album && track.Album[0]) || "";
//                      mediaItem.genres = "";
//                      mediaItem.artists = (track.Performer && track.Performer[0]) || "";
//                      mediaItem.composers = (track.Performer && track.Performer[0]) || "";
//                      mediaItem.lyrics = "";
//                      mediaItem.copyright = "";
//                      mediaItem.bitrate = (track.Overall_bit_rate && track.Overall_bit_rate[0]) || "";
//                      mediaItem.trackNumber = (track.Track_name_Position && track.Track_name_Position[0]) || "";
//                      mediaItem.duration = (track.Duration && track.Duration[0]) || "";
//                      mediaItem.playedTime = 0;
//                      mediaItem.playCount = 0;
//                      mediaItem.editableAttributes = [mediaItem.playedTime, mediaItem.playCount];
//                    } else if (current.track && current.track[1] && current.track[1].$["type"] === "Video") {
//                      mediaItem.geolocation = "";
//                      mediaItem.album = (track.Album && track.Album[0]) || '';
//                      mediaItem.artists = (track.Performer && track.Performer[0]) || '';
//                      mediaItem.duration = (current.track && current.track[1] && current.track[1].Duration)|| '';
//                      mediaItem.width = (current.track && current.track[1] && current.track[1].Width) || 0;
//                      mediaItem.height = (current.track && current.track[1] && current.track[1].Height) || 0;
//                      mediaItem.playedTime = 0;
//                      mediaItem.playCount = 0;
//                      mediaItem.editableAttributes = [mediaItem.playedTime, mediaItem.playCount];
//                    } else if (current.track && current.track[1] && current.track[1].$["type"] === "Image") {
//                      mediaItem.geolocation = "";
//                      mediaItem.width = (current.track && current.track[1] && current.track[1].Width[0]) || 0;
//                      mediaItem.height = (current.track && current.track[1] && current.track[1].Height[0]) || 0;
//                      mediaItem.editableAttributes = [];
//                      if((track.Complete_name && track.Complete_name[0])){
//                        mediaItem.thumbnailURIs = [thumbs.getThumbUrl(track.Complete_name[0],function(){},function(){})];
//                      }
//                    }
                    items.push(mediaItem);
                });
            }
            successCB(items);
        });
    };

    this.getLocalFolders = function (params, successCB, errorCB) {
        _service.Browse({
            ObjectID: 0,
            BrowseFlag: "BrowseDirectChildren",
            Filter: "*",
            StartingIndex: 0,
            RequestedCount: 999,
            SortCriteria: "+dc:title"
        }, function(res) {
            if (isErr(res)) {
                errorCB(res.message);
                return;
            }

            parseBrowseResponse(res.Result, successCB, errorCB);
        });
    };

    var find = function (params, successCB, errorCB) {
        var folderID, singleItem;

        if (params.folderId && params.fileName) {
            folderID = 0; // from root
            singleItem = {
                id: params.folderId,
                title: params.fileName
            };
        } else {
            folderID = params && params[0] ? params[0] : 0;
        }

        var getFolds = function(fID, cb) {
            _service.Browse({
                ObjectID: fID,
                BrowseFlag: "BrowseDirectChildren",
                Filter: "*",
                StartingIndex: 0,
                RequestedCount: 999,
                SortCriteria: "+dc:title"
            }, function(res) {
                if (isErr(res)) {
                    if (res.code === 501 && res.message === 'Action failed') {
                        cb(undefined, []); // empty folder?
                    } else {
                        cb(res.message);
                    }
                    return;
                }

                parseBrowseResponse(res.Result, function(folders) {
                    cb(undefined, folders);
                }, function(err) {
                    cb(err);
                });
            });
        };

        var uniq = function(list) {
            var seen = [];
            list.forEach(function(item) {
                for (var i=0; i<seen.length; i++) {
                    if (seen[i].id === item.id) {
                        return;
                    }
                }
                seen.push(item);
            });
            return seen;
        }

        var getFilesFlat = function(keys, cb) {
            var list = [];
            var cbCount = keys.length;

            var backFromSubCB = function(l){
                list = list.concat(l);
                cbCount--;
                if(cbCount==0) cb(uniq(list));
            };

            for (var i=0; i<keys.length; i++) {
                // is item?
                if (keys[i].thumbnailURIs) {
                    cbCount--;

                    if (singleItem) {
                        if (keys[i].id === singleItem.id && keys[i].title === singleItem.title) {
                            list = list.concat(keys[i]);
                        }
                    } else {
                        list = list.concat(keys[i]);
                    }

                } else {
                    getFolds(keys[i].id, function(err, res) {
                        getFilesFlat(res,backFromSubCB);
                    });
                }
            }
            if (cbCount==0) cb(uniq(list));
        };

        getFolds(folderID, function(err, folders) {
            if (err) {
                console.log(err);
                errorCB(err);
                return;
            }

            getFilesFlat(folders, function(fff) {
                successCB(fff);
            });
        });
    };

    this.findItem = function (params, successCB, errorCB) {
        find(params, successCB, errorCB);
    };

    this.getLink = function (params, successCB, errorCB) {
        find(params, function(items) {
            if (items.length) {
                successCB(items[0].itemURI);
            } else {
                errorCB("no link :(");
            }
        }, errorCB);
    };

    this.updateItem = function (params, successCB, errorCB, item) {
        errorCB("not implemented");
    };

    this.updateItemsBatch = function (params, successCB, errorCB, items) {
        errorCB("not implemented");
    };

    this.getContents = function (params, successCB, errorCB, objectRef) {
        errorCB("not implemented");
    };
};

MediaServerService.prototype = new RPCWebinosService;

module.exports = UPnPMediaServerModule;
