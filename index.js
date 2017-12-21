//var bioParsers = require('bio-parsers');

/*

  WARNING: This code is fragile.
  any change to the Gravity Form may change the <input> IDs
  and then you will have to change the variables below.

*/
var sequenceID = 'input_6_4'; // ID of sequences <textarea> element
var fileUploadID = 'input_6_12'; // ID of file upload <input> element
var formID = 'gform_6'; // ID of <form> element
var pdcCheckboxID = 'choice_6_10_1'; // ID of PDC checkbox <input> element

// translation from form element names to PDC expected names
var translation = {
  input_1: 'first',
  input_2: 'last',
  input_7: 'email',
  input_5: 'description'
}

// input_9.1 - input_9.5


// the secret/captcha for the PDC API
var pdcSecret = 'not_a_secret';

// The text to look for (case insensitive) to see if there was an error
// when post'ing to tenkGenesUrl
var validationErrorRegex = /there was a problem with your submission/i;

// URLs to use:
//var pdcUrl = "http://localhost:8080/tenkgenes";
var pdcUrl = "https://pdc.biobricks.org/tenkgenes";
var tenkGenesUrl = '/10k-genes-survey/';


function csvParser(text) {
  var seqs = [];
  var seq;

  lines = text.split(/\r?\n/);
  var i, cur, seqPart;
  for(i=0; i < lines.length; i++) {
    cur = lines[i].split(/\s*,\s*/);
    if(cur.length < 2) continue;
    
    seq = {
      meta: cur[0],
      sequence: cur[1].replace(/\s+/g, '')
    }

    if(!seq.sequence) continue;
    seqs.push(seq);
  }
  return seqs;
}

function stupidFastaParser(text) {
  var seqs = [];
  var seq;

  lines = text.split(/\r?\n/);
  var i, cur, seqPart;
  for(i=0; i < lines.length; i++) {
    cur = lines[i];
    if(cur.match(/^\s*[\>\;]/)) {
      if(seq) seqs.push(seq);
      seq = {
        meta: cur,
        sequence: ''
      }
      continue;
    }
    if(!seq) continue;

    seqPart = cur.replace(/\s+/g, '');
    if(seqPart.length) seq.sequence += seqPart;
  }
  if(seq) seqs.push(seq);
  return seqs;
}


function error(err) {
  console.error(err);
}



function addSeq(seq) {
  var el = document.createElement('INPUT');
  el.type = 'hidden';

//  var el = document.createElement('TEXTAREA');
  el.name = "sequences[]";
//  el.rows = 10;
//  el.cols = 70;
//  el.innerHTML = seq;
  el.value = seq;

  document.getElementById(formID).appendChild(el);

}

function readNext(files, i, cb) {

  var reader = new FileReader();
  
  reader.onload = function(e) {
    
    var seqs = csvParser(e.target.result);
    var i;
    for(i=0; i < seqs.length; i++) {
      addSeq(seqs[i].sequence);
    }
    
    setTimeout(function() {
      i++;
      if(i >= files.length) {
        return cb();  
      }
      readNext(files, i, cb);
    });
  }
  reader.readAsText(files[i]);
}

function handleUpload(e) {

if(!e || !e.target || !e.target.files) {
  return alert("Sorry. This browser is not supported. Try using the latest Firefox.");
}

var files = e.target.files;
readNext(files, 0, function() {
  document.getElementById(fileUploadID).value = '';
});

}

function submitToPdc() {
  document.getElementById(formID).action = pdcUrl;
  $('#'+formID).submit();
}

function postSuccess(data) {
    
  if(data.match(validationErrorRegex)) {
    alert("There was a problem with your submission.\nTry unchecking the Public Domain Chronicle checkbox.\n Afterwards you can manually submit at:\n\nhttps://pdc.biobricks.org/publish\n");
    return;
  }


  console.log("HIDING");

  $('#main-content article').hide();
 
  var el = document.createElement("article");
  el.innerHTML = '<div class="entry-content"><div class="et_pb_section  et_pb_section_0 et_section_regular"><div class=" et_pb_row et_pb_row_0"><div class="class="et_pb_code et_pb_module  et_pb_code_0""><p><strong>Thanks for submitting your request! Please check your email to confirm your submission.</strong><p><p><a href="#" onclick="submitToPdc()">Click here to</a> continue your submission at the Public Domain Chronicle.</p></div></div></div></div>';
  
  document.getElementById('main-content').appendChild(el);

}

function objectifyForm(id) {

  var formArray = $('#'+id).serializeArray();

  var returnArray = {};
  for (var i = 0; i < formArray.length; i++){
    returnArray[formArray[i]['name']] = formArray[i]['value'];
  }
  return returnArray;
}

function getText(el) {
  return el.clone().children().remove().end().text();
}

function validate() {

  var missing = false;

  var o = objectifyForm(formID);
  var key, val, id, el;
  for(key in o) {
    val = o[key];
    if(key === 'secret') continue;

    if(!val.replace(/\s+/g, '')) {
      if($('[name="'+key+'"]').attr('type') == 'hidden') continue;

      missing = true;
      console.log("MISSING:", key);
      break;
    }

  }

  if(missing) {
    alert("You must fill out all fields.\nIt looks like you are missing some of them");
    return false;
  }
  return true;
}

function addPair(key, val) {
  var el = document.createElement('INPUT');
  el.type = 'hidden';
  el.name = key;
  el.value = val;
  document.getElementById(formID).appendChild(el);
}

function translateKeys() {
  var key, val;
  for(key in translation) {
    val = $("[name='"+key+"']").val();
    if(val) {
      addPair(translation[key], val);
    }
  }
}

function onSubmit(e) {

  var checkbox = document.getElementById(pdcCheckboxID);
  if(checkbox.type !== 'checkbox') return;
  if(!checkbox.checked) return;

  e.preventDefault();

  if(!validate()) {
    return;
  }

  var seqData = $('#'+sequenceID).val();
  var seqs = stupidFastaParser(seqData);

  var i;
  for(i=0; i < seqs.length; i++) {
    addSeq(seqs[i].sequence);
  }

  var sec = document.createElement('INPUT');
  sec.type = 'hidden';
  sec.name = 'secret';
  sec.value = pdcSecret;
  document.getElementById(formID).appendChild(sec);

  translateKeys();

  var o = $('#'+formID).serialize();

  $.post(tenkGenesUrl, o, postSuccess).fail(function(err) {

    console.error("Error POSTing data:", err.responseText);
  });


  return false;
}


document.getElementById(fileUploadID).addEventListener('change', handleUpload, false);

document.getElementById(formID).addEventListener('submit', onSubmit, false);
