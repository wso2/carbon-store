/*
 Description:The class is used to provided an API to store files in a source independent way
             It supports the following operations:
             1. get(key)
             2. put({file,contentType})
             The StorageManager works by using a UUID as the key for the stored file.

             This implementation needs to be changed such that the StorageManager can use multiple
             providers (e.g. db or filesystem)

Filename: storage.js
Created Date: 15/10/2013

 */
var storageModule = function () {

    var log = new Log('storage');
    var uuid=require('uuid');

    var utility = require('/modules/utility.js').rxt_utility();
    var modelManagement = require('/modules/data/model.manager.js').modelManager();
    var driverManagement = require('/modules/data/driver.manager.js').driverManager();

    var CACHE_SM = 'storageManager';


    function StorageManager(options) {

//        this.connectionInfo = null;
//        this.context = null;
//        this.isCached = false;
//
//
//
//        this.init(options);
//
//
//
//        //If caching is enabled obtain
//        if (this.isCached) {
//            var cached = getCached();
//
//            if (cached) {
//                //Attach a new driver to the cached version
//                var driver = cached.driverManager.get('default');
//                cached.modelManager.driver = driver;
//                return cached;
//            }
//
//            //Store in the cache
//            putInCache(this);
//        }
//
//        this.prepare();
//
//        //Attach a new driver
//        var driver = this.driverManager.get(this.connectionInfo.dataSource);
//        this.modelManager.driver = driver;

    };

    /*
    The function creates the model manager and drive manager which is used
    by the Storage Manager
     */
    StorageManager.prototype.prepare = function () {
        //Create an instance of the driver manager
        this.driverManager = new driverManagement.DriverManager();

        //Get a default driver
        var driver = this.driverManager.get(this.connectionInfo.dataSource);

        //Create an instance of the model manager
        this.modelManager = new modelManagement.ModelManager({driver: driver, connectionInfo: this.connectionInfo});
    }

    function getCached() {
        var cachedManager = application.get(CACHE_SM);

        if (cachedManager) {
            //log.debug('cached');
            return cachedManager;
        }
        else {
            //log.debug('not cached');
            return null;
        }
    }

    function putInCache(manager) {
        application.put(CACHE_SM, manager);
    }

    /*
     The function initializes the storage manager
     */
    StorageManager.prototype.init = function (options) {
        utility.config(options, this);
    };

    /*
     The function puts a resource into storage
     @key: The key to use in the storage
     @value: An object containing the contentType and a file
     */
    StorageManager.prototype.put = function (fileObject) {
        var registryOperator = require("/modules/registry/registry.operator.js").registryOperator();
        return registryOperator.addFile(fileObject);
    };


var FIRST_ELEMENT=0;
var WINDOWS_SPLITTER='\\';

/*
The function accepts a file path and extracts the name.It can process upload file paths
sent from IE and other browsers
 */
function parseFileName(url){
    var fileName=determineOS(url);
    //log.info('file name:'+fileName);
    return fileName;
}

/*
The function determines the type of OS which the file path originates
@path: The path to be processed
@return: The extracted file name
 */
function determineOS(path){
    var components=path.split('\\');

    if(components.length>1){
        return obtainFromWindowsPath(components);
    }
    return obtainFromOtherOSPath(path);
}

/*
The function obtains a windows path
@path: The  to be processed
@return: The extracted file name
 */
function obtainFromWindowsPath(path){
	//log.info('windows path:'+fileName);
   var fileName=path[path.length-1];
   return fileName;
}

/*
The function is used to extract a file name from a non windows path
@path: The path to be processed
@return: The extracted file name
 */
	function obtainFromOtherOSPath(path){
	   var comps=path.split('/');
	   //log.info('other os: '+comps);
	
	   if(comps.length<=1){
	       return comps[FIRST_ELEMENT];
	   }
	   return comps[comps.length-1];
	}
    /*
     The function returns a url to the provided key
     @key: The key by which to search
     @return: A url of the form context/tenant/uuid
     */
    StorageManager.prototype.get = function (key) {

        //The key should be the uuid and tenant id

        //Obtain a resource model
        var resource = this.modelManager.get('Resource');

        //Split the key
        var splitList=key.split('/');

        var id;
        //The key did not have a file component
        if(splitList.length<2){
            //log.debug('just uuid');
            id=key;
        }
        else{
            //log.debug('uuid/file');
            id=splitList[0];
        }

        //log.debug('uuid is '+id);

        var results = resource.find({uuid:id}) || [];

        //log.debug(results[0].fileName);
        return results[0] || null;
    };

    /*
    The function constructs a url from the uuid and context
    @context: The context of the request
    @uuid: The uuid of the resource
     */
    function constructStorageUrl(context,uuid){
      var url=context+'/storage/'+uuid;
      return url;
    };


    return{
        StorageManager: StorageManager,
        constructStorageUrl:constructStorageUrl
    }
};
