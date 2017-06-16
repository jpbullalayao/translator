module.exports.translateStringToObject = translateStringToObject;
module.exports.translateObjectToString = translateObjectToString;
module.exports.utils = utils;

/**** Sample Configuration and Objects ************************************* */

var configuration = [
  { propKey: 'Prop0', objectType: 'User', objectKey: 'name' },
  { propKey: 'Prop1', objectType: 'User', objectKey: 'address.streetAddresses[0]' },
  { propKey: 'Prop2', objectType: 'User', objectKey: 'address.streetAddresses[1]' },

  { propKey: 'Prop3', objectType: 'User', objectKey: 'address.city' },
  { propKey: 'Prop4', objectType: 'User', objectKey: 'address.state', toObject: 'toShortState', toProp: 'toLongState' },
  { propKey: 'Prop5', objectType: 'User', objectKey: 'address.zipCode' },
  { propKey: 'Prop32', objectType: 'User', objectKey: 'yearsExperience', toObject: Number }
];

var sampleUser = {
  name: 'Patrick Fowler',
  address: {
      streetAddresses: ['', '123 Fake St.'],
      city: 'Fakeville',
      state: 'CA',
      zipCode: '45678'
  },
  yearsExperience: 7
};

var sampleUserString = 'Prop0:Patrick Fowler,Prop2:123 Fake St,Prop3:Fakeville,Prop4:California,Prop5:45678,Prop32:7';

/**** Implementation START ************************************************* */

/**
 * translateStringToObject
 * @param {String} inputString An arbitrary string to be translated
 * @param {Function} callback The callback that is executed when the process is completed. (In this case, a callback is provided to 
 * reserialize the asynchronously returned object
 */
function translateStringToObject(inputString, callback) {
  var translatedObject = {}
  var splitString = inputString.split(',');

  for (string of splitString) {
    var splitSubstring = string.split(':');
    var config = configuration.find(config => config.propKey === splitSubstring[0]);
    
    if (config) {
      var value = splitSubstring[1];
      var nestedKeys = config.objectKey.split('.');
      var arrayRegex = /([a-zA-z]*)(\[\d\]*)/g;
      var matches = arrayRegex.exec(nestedKeys[1]);

      // If object key is accessing an array index
      if (matches) {
        var arrayIndexRegex = /\[(\d)+\]/g;
        var arrayIndex = arrayIndexRegex.exec(matches[2])[1];
        
        var arrayValue = [];
        
        // Insert any empty strings into array if necessary
        for (i = 0; i < arrayIndex; i++) {
          arrayValue.push('');
        }
        
        arrayValue.push(value);
        value = arrayValue;
        
        if (translatedObject[nestedKeys[0]] == undefined) {
          translatedObject[nestedKeys[0]] = {};
        }

        translatedObject[nestedKeys[0]][matches[1]] = value;
      } else {
        if (config.toObject) {
          if (config.toObject === Number) {
            value = parseInt(value);
          } else {
            value = utils[config.toObject](value);
          }// Add more here if necessary in a production environment
        }
    
        if (nestedKeys.length > 1) {
          if (translatedObject[nestedKeys[0]] == undefined) {
            translatedObject[nestedKeys[0]] = {};
          }
          
          translatedObject[nestedKeys[0]][nestedKeys[1]] = value;
        } else {
         translatedObject[config.objectKey] = value;      
        }          
      }
    }
  }

  // Ensure that the callback is actually a function before attempting to use it
  if (typeof callback === Function) {
    callback(translatedObject);
  }
  
  return translatedObject; 
}

/**
 * translateObjectToString
 * @param {Object} inputObject An arbitrary object to be translated
 * @returns {String} A string representation of the input object
 */
function translateObjectToString(inputObject) {
  var translatedObject = '';

  configuration.forEach(function (value, i) {
    keys = configuration[i].objectKey.split('.');
    objectKeyValue = inputObject

    keys.forEach(function (value, i) {
      if (i === keys.length - 1) {
        var arrayRegex = /([a-zA-Z]+)\[(\d)+\]/g;
        var matches = arrayRegex.exec(value);
        
        if (matches) {
          var objectKey = matches[1];
          var arrayIndex = parseInt(matches[2]);
          
          objectKeyValue = objectKeyValue[objectKey][arrayIndex];
        } else {
          objectKeyValue = objectKeyValue[value];
        }
      } else {
        objectKeyValue = objectKeyValue[value];
      }
    });

    // Transform value if necessary
    if (value.toProp) {
      objectKeyValue = utils[value.toProp](objectKeyValue);
    }

    // Cast value to correct object/type if necessary
    if (value.toObject) {
      if (value.toObject === Number) {
        objectKeyValue = parseInt(objectKeyValue);
      }

      // Insert implementation for anymore potential toObject options
    }

    // Construct string
    if (objectKeyValue !== '') {
      translatedObject += `${configuration[i].propKey}:${objectKeyValue}`;
      
      if (configuration.length > i + 1) {
        translatedObject += ',';
      }
    }
  });

  return translatedObject;
}
/**** Implementation END ************************************************* */

/**
 * Utlities Pseudo-Module:
 * Assume that any required translations will be available here and will return
 * the expected value.
 */

var utils = (function () {
  return {
      toShortState: toShortState,
      toLongState: toLongState,
  };
  
  // Assume that all States will be properly translated
  function toShortState(state) {
      switch (state.toLowerCase()) {
          case 'california': return 'CA';
          default: return state;
      }
  }

  function toLongState(state) {
      switch (state.toUpperCase()) {
          case 'CA': return 'California';
          default: return state;
      }
  }
})();