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

  stripePromises.push(
    stripe.createToken('bank_account', {
      country: 'US',
      currency: 'usd',
      routing_number: '110000000',
      account_number: '000123456789',
      account_holder_name: 'Jenny Rosen',
      account_holder_type: 'individual',
    }).then(function(result) {
      document.querySelector('[data-external-account]').value = result.token.id;
    })
  )
  
  stripePromises.push(
    stripe.createToken('account', {
    business_type: 'company',
    company: {
      name: document.querySelector('.company [data-business-name]').value,
      phone: document.querySelector('.company [data-phone]').value,
      address: {
        line1: document.querySelector('.company [data-address]').value,
        city: document.querySelector('.company [data-city]').value,
        state: document.querySelector('.company [data-state]').value,
        postal_code: document.querySelector('.company [data-zip]').value,
      },
    },
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

    let dobValue = person.querySelector('[data-date-of-birth]').value
    if (dobValue.length != 0 ) {
      let dob = dobValue.split('/');
      stripePerson.dob = {}
      if (dob[0] != undefined) stripePerson.dob.day = dob[0]
      if (dob[1] != undefined) stripePerson.dob.month = dob[1]
      if (dob[2] != undefined) stripePerson.dob.year = dob[2]
    }

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
  });

}

