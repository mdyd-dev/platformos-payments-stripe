// Assumes you've already included Stripe.js!
const stripe = Stripe(stripe_pk);
console.log(stripe_pk);
const myForm = document.querySelector('.account-form');
myForm.addEventListener('submit', handleForm);

const processExternalAccount = () => {
  let bank_account_container = document.querySelector('.external_account')
  
  if (!bank_account_container.hasAttribute('disabled')) {
    let bank_account = {
      country: bank_account_container.querySelector('[data-country]').value,
      currency: bank_account_container.querySelector('[data-currency]').value,
      routing_number: bank_account_container.querySelector('[data-routing-number]').value,
      account_number: bank_account_container.querySelector('[data-account-number]').value,
      account_holder_name: bank_account_container.querySelector('[data-account-holder-name]').value,
      account_holder_type: bank_account_container.querySelector('[data-account-holder-type]').value,
    }
    
    return stripe.createToken('bank_account', bank_account).then(
      function(result) {
        if ( result.error ) { 
          console.log("THEN", result.error)
          document.querySelector('.external_account .errors').textContent = result.error.message;
          return Promise.reject()
        } else {
          console.log("YAY SETTING TOKEN", result.token.id );
          document.querySelector('[data-external-account]').value = result.token.id;
          return Promise.resolve()
        }
      }
    ).catch(
      function(result) {
        console.log("CATCH", result)
        return Promise.reject()
      }
    )
  }
}

const processIndividual = () => {
  console.log("processing individual account");
  let individualContainer = document.querySelector('.individual')
  
  if (individualContainer.hasAttribute('disabled')) return Promise.resolve();



  return stripe.createToken('account', {
    business_type: 'individual',
    individual: {},
    tos_shown_and_accepted: true,
  }).then(function(result) {
    console.log("INDIVIDUAL ACCOUNT result", result);
    document.querySelector('#account-token').value = result.token.id;
  }, function(error) {
    console.log("INDIVIDUAL ACCOUNT ERROR result", error);
  });
}

const processCompany = () => {
  let companyContainer = document.querySelector('.company')
  
  if (companyContainer.hasAttribute('disabled')) return Promise.resolve();

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
  if (tax_id != undefined) {
    company.tax_id = tax_id;
  }

  return stripe.createToken('account', {
    business_type: 'company',
    company: company,
    tos_shown_and_accepted: true,
  }).then(function(result, person) {
    document.querySelector('#account-token').value = result.token.id;
  });
}

const processPersons = () => {
  const persons = document.querySelectorAll('.person')

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
    
    let idNumber = person.querySelector('[data-id-number]').value
    if (idNumber) {
      stripePerson.person.id_number = idNumber;
    }
    let dobValue = person.querySelector('[data-date-of-birth]').value
    if (dobValue.length != 0 ) {
      let dob = dobValue.split('/');
      stripePerson.person.dob = {}
      if (dob[0] != undefined) stripePerson.person.dob.day = dob[0]
      if (dob[1] != undefined) stripePerson.person.dob.month = dob[1]
      if (dob[2] != undefined) stripePerson.person.dob.year = dob[2]
    }

    let filePromises = [];
    filePromises.push(setPersonDocument(person, stripePerson, 'front'));
    let back = setPersonDocument(person, stripePerson, 'back')
    filePromises.push(back);
    console.log("filePromises", filePromises);
    Promise.all( filePromises ).then( () => {
      console.log("stripe person", stripePerson);
      stripe.createToken('person', stripePerson).then(
        function(person, result) {
          console.log("Person Token", result.token.id );
          person.querySelector('[data-person-token]').value = result.token.id;
        }.bind(null, person)
      );
    })
  }
}

const setPersonDocument = (person, stripePerson, side) => {
  let documentFile = person.querySelector(`[data-${side}-photo-id]`).files[0];
  if (documentFile == undefined) return Promise.resolve();
  
  return processFile(documentFile).then(
    function(stripePerson, response) {
      response.json().then( (json) => {
        console.log("JSON", json);
        setDocumentToken(stripePerson, side, json.id);
      })
    }.bind(null, stripePerson),
    function(error) {
      console.log("FILE ERROR", error);
    }
  );
}

const setDocumentToken = (stripePerson, side, token) => {
  if (stripePerson.person.verification == undefined ) {
    stripePerson.person.verification = { document: {}};
  }
  stripePerson.person.verification.document[side] = token;
}

const processFile = (file) => {
  console.log("Processing file with", stripe._apiKey );
  const data = new FormData();
  data.append('file', file);
  data.append('purpose', 'identity_document');
  console.log("REQUEST", data);
  
  return fetch('https://uploads.stripe.com/v1/files', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${stripe._apiKey}`},
    body: data,
  })
}

async function handleForm(event) {
  event.preventDefault();
  
  let stripePromises = [];

  stripePromises.push(processExternalAccount());
  stripePromises.push(processIndividual());
  stripePromises.push(processCompany());
  stripePromises.push(processPersons());

  await Promise.all(stripePromises).then(function(result, person) {
    myForm.submit();
  })
  .catch( 
    error => { console.log("Error", error) }
  );

}

