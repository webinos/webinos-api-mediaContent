/*******************************************************************************
 *  Code contributed to the webinos project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 2013 Fraunhofer FOKUS
 ******************************************************************************/

describe("MediaContent API", function() {
    var mediaContentService;
    var mediaContentServiceBound;

    webinos.discovery.findServices(new ServiceType("http://webinos.org/api/mediacontent"), {
        onFound: function (service) {
            mediaContentService = service;
        }
    });

    beforeEach(function() {
        waitsFor(function() {
            return !!mediaContentService;
        }, "the discovery to find an MediaContent service", 10000);
    });

    it("should be available from the discovery", function() {
        expect(mediaContentService).toBeDefined();
    });

    it("has the necessary properties as service object", function() {
        expect(mediaContentService.state).toBeDefined();
        expect(mediaContentService.api).toEqual(jasmine.any(String));
        expect(mediaContentService.id).toEqual(jasmine.any(String));
        expect(mediaContentService.displayName).toEqual(jasmine.any(String));
        expect(mediaContentService.description).toEqual(jasmine.any(String));
        expect(mediaContentService.icon).toEqual(jasmine.any(String));
        expect(mediaContentService.bindService).toEqual(jasmine.any(Function));
    });

    it("can be bound", function() {
        mediaContentService.bindService({onBind: function(service) {
            mediaContentServiceBound = service;
        }});

        waitsFor(function() {
            return !!mediaContentServiceBound;
        }, "the service to be bound", 4000);
    });

    describe("with bound service", function() {

        beforeEach(function() {
            waitsFor(function() {
                return !!mediaContentServiceBound;
            }, "service is defined, was bound");
        });

        it("has specified service methods", function() {
            expect(mediaContentServiceBound.update).toEqual(jasmine.any(Function));
            expect(mediaContentServiceBound.updateBatch).toEqual(jasmine.any(Function));
            expect(mediaContentServiceBound.getDirectories).toEqual(jasmine.any(Function));
            expect(mediaContentServiceBound.scanFile).toEqual(jasmine.any(Function));
            expect(mediaContentServiceBound.setChangeListener).toEqual(jasmine.any(Function));
            expect(mediaContentServiceBound.unsetChangeListener).toEqual(jasmine.any(Function));
        });

        it("can find items", function() {
            var hasFoundItems;
            mediaContentServiceBound.find(function() {
                hasFoundItems = true;
            });

            waitsFor(function() {
                return hasFoundItems;
            });
        });
    });
});
