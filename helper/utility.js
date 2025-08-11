// HOF to catch errors
exports.use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
  
exports.convertToMonthName = function(month){

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May',
  'Jun', 'Jul','Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return monthNames[month-1];

}

exports.validate = function(form, fields){

  // sanitise the input
  Object.keys(form).forEach(f => {

    // sanitise
    if (typeof form[f] === 'string' && form[f]?.includes('<script>')){

      form[f] = form[f].replace('<script>', '');
      form[f] = form[f].replace('</script>', '');

    }
  });

  if (fields?.length){
    fields.forEach((f, i) => {    
      if (!form.hasOwnProperty(f) || !form[f]){

        // field is required
        throw { message: f + ' field is required' };

      }
    });
  }
}

exports.assert = function(data, err, input){

  if (!data)
    throw { message: err, ...input && { inputError: input }};

  return true;

}

exports.currencySymbol = {

  usd: '$',
  gbp: '£',
  eur: '€',
  aud: '$',
  cad: '$'

}

exports.formatDateString = function(d) {
  const formatter = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date(d));

}

exports.getAgeFromDate = function(dateString) {
    const birthDate = new Date(dateString);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

    if (!hasHadBirthdayThisYear) {
      age--;
    }

    return age;
}

exports.getAgeGroup = function(age) {
  if (age <= 30) return '18–30';
  if (age <= 40) return '31–40';
  return '41–50+';
}