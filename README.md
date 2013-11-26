# webinos media content API #

**Service Type**: http://webinos.org/api/mediacontent

The main concept of media content API is to !TODO!


## Installation ##

To install the media content API you will need to npm the node module inside the webinos pzp.

For end users, you can simply open a command prompt in the root of your webinos-pzp and do: 

	npm install https://github.com/webinos/webinos-api-mediaContent.git

For developers that want to tweak the API, you should fork this repository and clone your fork inside the node_module of your pzp.

	cd node_modules
	git clone https://github.com/<your GitHub account>/webinos-api-mediaContent.git
	cd webinos-api-mediaContent
	npm install


## Getting a reference to the service ##

To discover the service you will have to search for the "http://webinos.org/api/mediacontent" type. Example:

	var serviceType = "http://webinos.org/api/mediacontent";
	webinos.discovery.findServices( new ServiceType(serviceType), 
		{ 
			onFound: serviceFoundFn, 
			onError: handleErrorFn
		}
	);
	function serviceFoundFn(service){
		// Do something with the service
	};
	function handleErrorFn(error){
		// Notify user
		console.log(error.message);
	}

Alternatively you can use the webinos dashboard to allow the user choose the media content API to use. Example:
 	
	webinos.dashboard.open({
         module:'explorer',
	     data:{
         	service:[
            	'http://webinos.org/api/mediacontent'
         	],
            select:"services"
         }
     }).onAction(function successFn(data){
		  if (data.result.length > 0){
			// User selected some services
		  }
	 });

## Methods ##

Once you have a reference to an instance of a service you can use the following methods:

###findItem(successCB, errorCB, params)

To obtain a list of media items in a specific directory, use findItem method

###updateItem(successCB, errorCB)

The list of attributes that can be written back to the local backend using updateItem method

###updateItemsBatch(successCB, errorCB)

The list of attributes that can be written back to the local backend using updateItemsBatch method

###getContents(listener, errorCB, params)

Getcontents method retrieves (such as images, videos, or music) that are available on the device

###getLink(params, successCallback, errorCallback)

getlink method retrieves the link of the mediaitem that are available on the device


## Links ##

- [Specifications](http://dev.webinos.org/specifications/api/MediaContent.html)
- [Examples](https://github.com/webinos/webinos-api-mediaContent/wiki/Examples)

