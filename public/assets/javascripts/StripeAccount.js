// Assumes you've already included Stripe.js!
const stripe = Stripe(stripe_pk);
console.log(stripe_pk);
const myForm = document.querySelector('.create_account');
myForm.addEventListener('submit', handleForm);

const resolvedPromise = msg => {
  console.log("RESOLVED PROMISE", msg);
  return Promise.resolve(msg)
}

const processExternalAccount = () => {
  let bank_account_container = document.querySelector('.external_account')
  
  if (bank_account_container == null || bank_account_container.hasAttribute('disabled')) return resolvedPromise("External Account Disabled");

  let bank_account = {
    country: bank_account_container.querySelector('[data-country]').value,
    currency: bank_account_container.querySelector('[data-currency]').value,
    account_number: bank_account_container.querySelector('[data-account-number]').value,
    account_holder_name: bank_account_container.querySelector('[data-account-holder-name]').value,
    account_holder_type: bank_account_container.querySelector('[data-account-holder-type]').value,
  }
  
  let routingNumberInput = bank_account_container.querySelector('[data-routing-number]');
  if (routingNumberInput) {
    bank_account.routing_number = routingNumberInput.value
  }
  
  removeEmptyValues(bank_account);
  return stripe.createToken('bank_account', bank_account).then(
    function(result) {
      if ( result.error ) { 
        console.log("THEN", result.error)
        document.querySelector('.external_account .errors').textContent = result.error.message;
        return Promise.reject()
      } else {
        console.log("YAY SETTING TOKEN", result.token.id );
        document.querySelector('[data-external-account]').value = result.token.id;
        return resolvedPromise("Bank Account Set");
      }
    }
  ).catch(
    function(result) {
      console.log("CATCH", result)
      return Promise.reject();
    }
  )
}

const processIndividual = () => {
  console.log("processing individual account");
  let individualContainer = document.querySelector('.individual')
  
  if (individualContainer == null || individualContainer.hasAttribute('disabled')) return resolvedPromise("Individual Disabled");
  
  console.log("Individual?");
  return stripe.createToken('account', {
    business_type: 'individual',
    individual: {},
    tos_shown_and_accepted: true,
  }).then(function(result) {
    console.log("INDIVIDUAL ACCOUNT result", result);
    document.querySelector('#account-token').value = result.token.id;
    return resolvedPromise("Individual Token Set");
  }, function(error) {
    console.log("INDIVIDUAL ACCOUNT ERROR result", error);
  });
}

const processCompany = () => {
  let companyContainer = document.querySelector('.company')
  
  if (companyContainer == null || companyContainer.hasAttribute('disabled')) return resolvedPromise("Company Disabled");

  let company = {
    name: companyContainer.querySelector('[data-business-name]').value,
    phone: companyContainer.querySelector('[data-phone]').value,
    address: {
      line1: companyContainer.querySelector('[data-address]').value,
      city: companyContainer.querySelector('[data-city]').value,
      state: companyContainer.querySelector('[data-state]').value,
      postal_code: companyContainer.querySelector('[data-zip]').value,
    },
  }
 
  let tax_id = companyContainer.querySelector('[data-tax-id]').value;
  if ( tax_id.length != 0 ) {
    company.tax_id = tax_id;
  }
  console.log("COMPANY", company);
  return stripe.createToken('account', {
    business_type: 'company',
    company: company,
    tos_shown_and_accepted: true,
  }).then(function(result, person) {
    document.querySelector('#account-token').value = result.token.id;
  });
}

const processPersons = () => {
  return new Promise((resolve, reject) => {
    const persons = document.querySelectorAll('.person')
    if (persons.length == 0 ) return resolve();

    for (i = 0; i < persons.length; ++i) {
      let person = persons[i];

      let stripePerson = {
        person: {
          first_name: person.querySelector('[data-first-name]').value,
          last_name: person.querySelector('[data-last-name]').value,
          address: {
            line1: person.querySelector('[data-address]').value,
            city: person.querySelector('[data-city]').value,
            state: person.querySelector('[data-state]').value,
            postal_code: person.querySelector('[data-zip]').value,
          }
        }
      }

      let idNumberField = person.querySelector('[data-id-number]')
      if (idNumberField) {
        stripePerson.person.id_number = idNumberField.value;
      }

      let dobValue = person.querySelector('[data-date-of-birth]').value
      if (dobValue.length != 0 ) {
        let dob = dobValue.split('/');
        stripePerson.person.dob = {}
        if (dob[0] != undefined) stripePerson.person.dob.day = dob[0]
        if (dob[1] != undefined) stripePerson.person.dob.month = dob[1]
        if (dob[2] != undefined) stripePerson.person.dob.year = dob[2]
      }

      let frontFilePromise = setPersonDocument(person, stripePerson, 'front');
      let backFilePromise = setPersonDocument(person, stripePerson, 'back');

      Promise.all( [ frontFilePromise, backFilePromise ] ).then( () => {
        
        removeEmptyValues(stripePerson);
        console.log("stripePerson", stripePerson);
        stripe.createToken('person', stripePerson).then(

          function(person, result) {
            if ( result.error ) {
              console.log("THEN", result.error)
              person.querySelector('.errors').textContent = result.error.message;
              reject()
            } else {
              console.log("Person Token", result.token.id );
              person.querySelector('[data-person-token]').value = result.token.id;
              console.log("Resolving PERSONS PROMISE");
              resolve();
            }
          }.bind(null, person)
        );
      },
      error => { console.log(error) }
      )
    }
  });
}

const removeEmptyValues = obj => { 
  for (var i in obj) {
    if (obj[i] === null || obj[i].length == 0 ) {
      delete obj[i];
    } else if (typeof obj[i] === 'object') {
      removeEmptyValues(obj[i]);
    }
  }
} 

const setPersonDocument = (person, stripePerson, side) => {
  let documentFile = person.querySelector(`[data-${side}-photo-id]`).files[0];
  if (documentFile == undefined) return Promise.resolve();
  
  return processFile(documentFile, stripePerson, side);
}

const setDocumentToken = (stripePerson, side, token) => {
  if (stripePerson.person.verification == undefined ) {
    stripePerson.person.verification = { document: {}};
  }
  stripePerson.person.verification.document[side] = token;
}

const processFile = (file, stripePerson, side) => {
  console.log("Processing file with", stripe._apiKey );
  const data = new FormData();
  data.append('file', file);
  data.append('purpose', 'identity_document');
  console.log("REQUEST", data);
  
  return new Promise((resolve, reject) => {
    fetch('https://uploads.stripe.com/v1/files', {
      method: 'POST',
      headers: {'Authorization': `Bearer ${stripe._apiKey}`},
      body: data,
    })
    .then(fileResponse => fileResponse.json())
    .then(json => {
        setDocumentToken(stripePerson, side, json.id);
        resolve();
      }
    )
  });
}

async function handleForm(event) {
  event.preventDefault();
  
  let stripePromises = [];

  stripePromises.push(processExternalAccount());
  stripePromises.push(processIndividual());
  stripePromises.push(processCompany());
  stripePromises.push(processPersons());
  
  console.log("stripePromises", stripePromises);
  Promise.all(stripePromises).then(function(result) {
    console.log("SUBMITTING");
    myForm.submit();
  },
  function(error) {
    console.log("error");
  })
  .catch( 
    error => { console.log("Error", error) }
  );

}

