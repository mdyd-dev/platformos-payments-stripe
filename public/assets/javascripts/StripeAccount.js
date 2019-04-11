// Assumes you've already included Stripe.js!
const stripe = Stripe(stripe_pk);
console.log(stripe_pk);
const myForm = document.querySelector('.account-form');
myForm.addEventListener('submit', handleForm);

async function handleForm(event) {
  console.log("Processing");
  event.preventDefault();




  const resolved = (result) => {
    console.log('Resolved');
  }

  const rejected = (result) => {
    console.log(result);
  }

  let stripePromises = [];

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
    
    stripePromises.push(
      stripe.createToken('bank_account', bank_account).then(
        function(result) {
          if ( result.error ) { 
            console.log("THEN", result.error)
            document.querySelector('.external_account .errors').textContent = result.error.message;
            return Promise.reject()
          } else {
            console.log("YAY SETTING TOKEN", result.token.id );
            document.querySelector('[data-external-account]').value = result.token.id;
          }
        }
      ).catch(
        function(result) {
          console.log("CATCH", result)
          return Promise.reject()
        }
      )
    )
  }
  let company = {
    name: document.querySelector('.company [data-business-name]').value,
    phone: document.querySelector('.company [data-phone]').value,
    address: {
      line1: document.querySelector('.company [data-address]').value,
      city: document.querySelector('.company [data-city]').value,
      state: document.querySelector('.company [data-state]').value,
      postal_code: document.querySelector('.company [data-zip]').value,
    },
  }
  let tax_id = document.querySelector('.company [data-tax-id]').value;
  if (tax_id) {
    company.tax_id = tax_id;
  }

  stripePromises.push(
    stripe.createToken('account', {
    business_type: 'company',
    company: company,
    tos_shown_and_accepted: true,
    }).then(function(result, person) {
      document.querySelector('#account-token').value = result.token.id;
    }));

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

    const data = new FormData();
    data.append('file', person.querySelector('[data-front-photo-id]').files[0]);
    data.append('purpose', 'identity_document');
    
    const fileResult = await fetch('https://uploads.stripe.com/v1/files', {
      method: 'POST',
      headers: {'Authorization': `Bearer ${stripe._apiKey}`},
      body: data,
    });
    const fileData = await fileResult.json();
    
    stripePerson.person.verification = {};
    stripePerson.person.verification.document = {};
    stripePerson.person.verification.document.front = fileData.id;
    console.log("SP", stripePerson);
    
    stripePromises.push(
      stripe.createToken('person', stripePerson).then(
        function(person, result) {
          person.querySelector('[data-person-token]').value = result.token.id;
        }.bind(null, person)
      )
    );

  }

  await Promise.all(stripePromises).then(function(result, person) {
    myForm.submit();
  }).catch( function() { console.log("DO NOTHING")} );

}

