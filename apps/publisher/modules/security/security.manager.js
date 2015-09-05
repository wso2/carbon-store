/*
Description: The class is used to manage the security aspects of the app
Created Date: 5/10/2013
Filename: security.manager.js
 */
securityManagementModule=function(){

    var APP_SECURITY_MANAGER='security.manager';
    var provider=require('/modules/security/url/url.security.provider.js').securityModule();
    var log=new Log('security.manager');

    function SecurityManager(){
        this.provider=provider;
    }


    /*
    The function is used to perform a security check on a request
    @cb: An optional callback function which will be invoked if a check fails
    @return: True if the check passes,else false
     */
    SecurityManager.prototype.check=function(session,cb){

        var passed=false;

        //Checks whether the request can be handled
        if(this.provider.isPermitted(session)){
            if(log.isDebugEnabled()){
                log.debug('passed the security check.');
            }

            this.provider.onSecurityCheckPass();

            passed=true;
        }
        else{
            if(log.isDebugEnabled()){
                log.debug('failed the security check.');
            }

            //Check if a user has provided a call back
            if(cb){
                cb();
            }
            else{
                this.provider.onSecurityCheckFail();
            }

        }

        return passed;
    }

    /*
    The function is used to obtain a cached copy of the
    SecurityManager
    @return: A cached copy of the Security Manager from the
            application context
     */
    function cached(){
       //var instance=application.get(APP_SECURITY_MANAGER);

       //Checks if an instance exists
       //if(!instance){
           instance=new SecurityManager();
       //}

       return instance;
    }

    return {
        SecurityManager:SecurityManager,
        cached:cached
    }
}

