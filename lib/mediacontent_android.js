var fs = require('fs');

function MediaContentAndroid () {

    var androidModule = require('bridge').load(
            'org.webinos.android.impl.mediacontent.MediaSourceManagerImpl', this);
    var localSource = androidModule.getLocalMediaSource();

    this.getLocalFolders = function(params, successCB, errorCB) {
        try {
            localSource.getFolders(successCB, errorCB);
        } catch (err) {
            errorCB(err);
        }
    };

    this.findItem = function(params, thumbs, successCB, errorCB) {
        try {
            var offset = parseInt(params.offset, 10) || 0,
                count = parseInt(params.count, 10) || 0;

            if (params.fileName) params.folderId = undefined;

            localSource.findItems(function(mediaItemCollection) {
                var mediaItems = [];
                for ( var j = 0; j < mediaItemCollection.size; j++) {
                    var item;
                    if (mediaItemCollection.audios[j] != null) {
                        item = mediaItemCollection.audios[j];
                    } else if (mediaItemCollection.images[j] != null) {
                        var item = mediaItemCollection.images[j];
                        item.thumbnailURIs = [thumbs.getThumbUrl(item.id)];
                    } else if (mediaItemCollection.videos[j] != null) {
                        item = mediaItemCollection.videos[j];
                    }
                    if (!item) continue;
                    if (params.fileName && params.fileName === item.title) {
                        return successCB(item);
                    }
                    mediaItems[j] = item;
                }
                successCB(mediaItems);
            },  errorCB, params.folderId, params.filter, params.sortMode, count, offset);

        } catch (err) {
            errorCB(err);
        }
    };

    this.getThumb = function(id, cb) {
        localSource.getThumb(parseInt(id, 10), function(err, thumb) {
            if (cb) cb(err, thumb);
        });
    };

    /**
     * This functionality is not implemented.
     */
    this.updateItem = function (params, successCB, errorCB, item) {
    };

    /**
     * This functionality is not implemented.
     */
    this.updateItemsBatch = function (params, successCB, errorCB, items) {
    };
};

var mediaContent = new MediaContentAndroid();

exports.getLocalFolders = mediaContent.getLocalFolders;
exports.findItem = mediaContent.findItem;
exports.getThumb = mediaContent.getThumb;
exports.updateItem = mediaContent.updateItem;
exports.updateItemsBatch = mediaContent.updateItemsBatch;
