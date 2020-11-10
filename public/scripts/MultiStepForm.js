$(".data-published-select").change(function() {
  if($(".data-published-select").val()==1){
    $(".data-published-section").removeClass("hidden");
  } else{
    $(".data-published-section").addClass("hidden");
  }
});

$(".data-embargo-select").change(function() {
  if($(".data-embargo-select").val()==1){
    $(".embargoDatePicker").removeClass("hidden");
  } else{
    $(".embargoDatePicker").addClass("hidden");
  }
});

// prepare the form when the DOM is ready 
$(document).ready(function() { 
    zip.workerScriptsPath = "/scripts/ziplib/";

    var options = { 
        //target:        '#uploadPageAlert',   // target element(s) to be updated with server response 
        beforeSubmit:  showRequest,  // pre-submit callback 
        uploadProgress: function(event, position, total, percentComplete) 
        {
            $("#bar").width(percentComplete+'%');
            $("#percent").html(percentComplete+'%');
            if(percentComplete == 100){
              $("#message").html("<font color='black'> File transfer is completed. Please wait for the server reponse !!</font>");
            }
     
        },
        success:       showResponse,  // post-submit callback
        //resetForm: true,
 
        // other available options: 
        //url:       url         // override for form's 'action' attribute 
        //type:      type        // 'get' or 'post', override for form's 'method' attribute 
        //dataType:  null        // 'xml', 'script', or 'json' (expected server response type) 
        //clearForm: true        // clear all form fields after successful submit 
        //resetForm: true        // reset the form after successful submit 
 
        // $.ajax options can be used here too, for example: 
        //timeout:   3000 
        /*statusCode: {
          403: function(data, textStatus, xhr) {
            console.log(data);
            console.log(textStatus);
            console.log(xhr.status);
          }
        } */  
        statusCode: {
          403: function(data, textStatus, xhr){
            console.log(data);
            showResponse(data.responseText, data.statusText, data.status);
          }
        }
    }; 
 
    // bind form using 'ajaxForm' 
    $('#uploadForm').ajaxForm(options); 
}); 
 
// pre-submit callback 
function showRequest(formData, jqForm, options) { 
    // formData is an array; here we use $.param to convert it to a string to display it 
    // but the form plugin does this for you automatically when it submits the data 
    //var queryString = $.param(formData); 
 
    // jqForm is a jQuery object encapsulating the form element.  To access the 
    // DOM element for the form do this: 
    // var formElement = jqForm[0]; 
 
    //alert('About to submit: \n\n' + queryString); 
 
    // here we could return false to prevent the form from being submitted; 
    // returning anything other than false will allow the form submit to continue 

    showAlert("","loading");
    

    var errors = "";
    if(validateUploadForm(errors)){
      return true;
    }
    else{
      showAlert(errors,"fail");
    }

    return false; 
} 
 
// post-submit callback 
function showResponse(responseText, statusText, xhr, $form)  { 
    // for normal html responses, the first argument to the success callback 
    // is the XMLHttpRequest object's responseText property 
 
    // if the ajaxForm method was passed an Options Object with the dataType 
    // property set to 'xml' then the first argument to the success callback 
    // is the XMLHttpRequest object's responseXML property 
 
    // if the ajaxForm method was passed an Options Object with the dataType 
    // property set to 'json' then the first argument to the success callback 
    // is the json data object returned by the server 
 
    //alert('status: ' + statusText + '\n\nresponseText: \n' + responseText + '\n\nThe output div should have already been updated with the responseText.');
    //console.log(statusText);   
    if(statusText=="success"){
     // window.location.replace('/result');\
     //showAlert(responseText,"success");
     $("html").html(responseText);
      showAlert(responseText,"success");
    }else{
      showAlert(responseText,"fail")
    }
} 

// TODO: implement front end validation
function validateUploadForm(){
  return true;
}

function validatefname() {
  if(uploadForm.fname.value == ""){
    $("#uploadFormFname").addClass("validationError");
        return false;
  }
  else{
    $("#uploadFormFname").removeClass("validationError");
    return true;
  }
}

function validatelname() {
  if(uploadForm.lname.value == ""){
    $("#uploadFormLname").addClass("validationError");
        return false;
  }
  else{
    $("#uploadFormLname").removeClass("validationError");
    return true;
  }
}

function validateemail() {

  var emailValid = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(uploadForm.email.value);
  
  if(!emailValid){
    $("#uploadFormEmail").addClass("validationError");
        return false;
  }
  else{
    $("#uploadFormEmail").removeClass("validationError");
    return true;
  }
}

function validateinstitute() {
  /*if(uploadForm.institute.value == ""){
    $("#instituteError").show ();
    return false;
  }
  else{
    $("#instituteError").hide();
    $("#mybtn").attr("disabled",false);
    return true;
  }*/
  return true;
}
function validatedType() {
  if(uploadForm.dataType.value == ""){
    $("#uploadFormDataType").addClass("validationError");
        return false;
  }
  else{
    $("#uploadFormDataType").removeClass("validationError");
    return true;
  }
}
function validatedFrom() {
  if(uploadForm.dataFrom.value == ""){
    $("#uploadFormDataFrom").addClass("validationError");
        return false;
  }
  else{
    $("#uploadFormDataFrom").removeClass("validationError");
    return true;
  }
}

function validateDataPublished() {
  var dataPublished = uploadForm.dataPublished.value==1;
  console.log("dataPublished :" + dataPublished);
  
  if(dataPublished){
    if(!validateCitation() || !validateDoi()){
      return false;
    }
    else
      return true;
  }
  else{
    return true;
  }
}

function validateCitation() {
  if(uploadForm.reference.value == ""){
    $("#uploadFormReference").addClass("validationError");
        return false;
  }
  else{
    $("#uploadFormReference").removeClass("validationError");
    return true;
  }
}

function validateDoi() {
  if(uploadForm.doi.value == ""){
    $("#uploadFormDoi").addClass("validationError");
        return false;
  }
  else{
    $("#uploadFormDoi").removeClass("validationError");
    return true;
  }
}


function validateStep(step){
  switch (step) {
    case 1:
      if (validatefname() && validateemail() && validatelname() && validateinstitute() && validatedType() && validatedFrom()) {
        $("#uploadFormStep1NextButton").attr("disabled", false);
      } else {
        $("#uploadFormStep1NextButton").attr("disabled", true);
      }
      break;
    case 2:
      if (validateDataPublished()) {
        $("#uploadFormStep2NextButton").attr("disabled", false);
      } else {
        $("#uploadFormStep2NextButton").attr("disabled", true);
      }
      break;
    case 3:
      if (true) {
        $("#uploadFormSubmitButton").attr("disabled", false);
      } else {
        $("#uploadFormSubmitButton").attr("disabled", true);
      }
      break;
  
    default:
      break;
  }

}

// show alert
function showAlert(alertMsg,alertType) {
    if(alertType=="loading"){
      $("#uploadPageAlert").text("");
      $("#loadingGif").removeClass("hidden");
      $("#progress").removeClass("hidden");
      $("#progress").show();
      //clear everything
      $("#bar").width('0%');
      //$("#message").html("");
      $("#percent").html("0%");
    }
    else if(alertType == "success"){
      $("#loadingGif").addClass("hidden");    
      $("#uploadPageAlert").text(alertMsg);
      $("#uploadPageAlert").removeClass("hidden");  
      $("#uploadPageAlert").addClass("alert-success");
      $("#uploadPageAlert").removeClass("alert-danger");
      //$("#message").html("<font color='black'> File transfer is completed</font>");
      $("#bar").width('100%');
      $("#percent").html('100%');
      
 
    } 
    else if(alertType == "fail"){
      $("#loadingGif").addClass("hidden");   
      //$("#progress").addClass("hidden");  
      $("#uploadPageAlert").text(alertMsg);
      $("#uploadPageAlert").removeClass("hidden");  
      $("#uploadPageAlert").removeClass("alert-success");
      $("#uploadPageAlert").addClass("alert-danger");
      //$("#message").html("<font color='black'> File transfer is completed</font>");  
      $("#bar").width('100%');
      $("#percent").html('100%');
      
    }
}

//jQuery time
var current_fs, next_fs, previous_fs; //fieldsets
var left, opacity, scale; //fieldset properties which we will animate
var animating; //flag to prevent quick multi-click glitches

$(".next").click(function(){
  if(animating) return false;
  animating = true;
  
  current_fs = $(this).parent();
  next_fs = $(this).parent().next();
  
  //activate next step on progressbar using the index of next_fs
  $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");
  
  //show the next fieldset
  next_fs.show(); 
  //hide the current fieldset with style
  current_fs.animate({opacity: 0}, {
    step: function(now, mx) {
      //as the opacity of current_fs reduces to 0 - stored in "now"
      //1. scale current_fs down to 80%
      scale = 1 - (1 - now) * 0.2;
      //2. bring next_fs from the right(50%)
      left = (now * 50)+"%";
      //3. increase opacity of next_fs to 1 as it moves in
      opacity = 1 - now;
      current_fs.css({
        'transform': 'scale('+scale+')',
        'position': 'absolute'
      });
      next_fs.css({'left': left, 'opacity': opacity});
    }, 
    duration: 800, 
    complete: function(){
      current_fs.hide();
      animating = false;
    }, 
    //this comes from the custom easing plugin
    easing: 'easeInOutBack'
  });
});

$(".previous").click(function(){
  if(animating) return false;
  animating = true;
  
  current_fs = $(this).parent();
  previous_fs = $(this).parent().prev();
  
  //de-activate current step on progressbar
  $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");
  
  //show the previous fieldset
  previous_fs.show(); 
  //hide the current fieldset with style
  current_fs.animate({opacity: 0}, {
    step: function(now, mx) {
      //as the opacity of current_fs reduces to 0 - stored in "now"
      //1. scale previous_fs from 80% to 100%
      scale = 0.8 + (1 - now) * 0.2;
      //2. take current_fs to the right(50%) - from 0%
      left = ((1-now) * 50)+"%";
      //3. increase opacity of previous_fs to 1 as it moves in
      opacity = 1 - now;
      current_fs.css({'left': left});
      previous_fs.css({'transform': 'scale('+scale+')', 'opacity': opacity});
    }, 
    duration: 800, 
    complete: function(){
      current_fs.hide();
      animating = false;
    }, 
    //this comes from the custom easing plugin
    easing: 'easeInOutBack'
  });
});
