function getOrderItem() {
  //Output errors:
  // - SellerMismatchError: Opportunity not available under Seller associated with specified auth key
  // - OpportunityNotFoundError: Opportunity not found


}


function getSeller(authKey, data) {
  return {
    "type": "Organization",
    "identifier": "CRUOZWJ1",
    "name": "Better",
    "taxMode": "https://openactive/TaxGross",
    "legalName": "Greenwich Leisure Limited",
    "description": "A charitable social enterprise for all the community",
    "url": "https://www.better.org.uk",
    "logo": {
      "type": "ImageObject",
      "url": "http://data.better.org.uk/images/logo.png"
    },
    "telephone": "020 3457 8700",
    "email": "customerservices@gll.org",
    "vatID": "GB 789 1234 56",
    "address": {
      "type": "PostalAddress",
      "streetAddress": "Alan Peacock Way",
      "addressLocality": "Village East",
      "addressRegion": "Middlesbrough",
      "postalCode": "TS4 3AE",
      "addressCountry": "GB"
    },
    "termsOfService": [
      {
        "type": "Terms",
        "name": "Privacy Policy",
        "url": "https://example.com/privacy-policy"
      },
      {
        "type": "Terms",
        "name": "Terms and Conditions",
        "url": "https://example.com/terms-and-conditions"
      }
    ]
  }
}

// Hardcoded mapping to represent the fields that the system supports storing
function getCustomerSupportedFields(customer) {
  return {
    "type": "Person",
    "email": customer.email,
    "telephone": customer.telephone,
    "givenName": customer.givenName,
    "familyName": customer.familyName
  }
}

// Hardcoded mapping to represent the fields that the system supports storing
function getAttendeeSupportedFields(attendee) {
  return {
    "type": "Person",
    "telephone": attendee.telephone,
    "givenName": attendee.givenName,
    "familyName": attendee.familyName
  }
}

function leaseOrCheckBookable(orderedItems, draftOrderQuote, checkpointStage, payer, authKey, data) {
  // Check for conflicted
  var conflictedOrderItems = getConflictedOrderItems(orderedItems, data);

  // Add errors to orderedItems
  foreach (orderedItem : orderedItems) {
    if (orderedItem.id in conflictedOrderItems) {
      orderedItem.error[] += renderError("OpportunityIsInConflictError");
    }
  }

  // Return lease
  return hasLease ? {
    "type": "Lease",
    "leaseExpires": datanow() + "20 minutes";
  } : null;
}


//// LIBRARY FUNCTIONS BELOW HERE

function getTaxArrayFromMap() {
  return Object.values(totalPaymentTaxMap);
}

function mergeAndAddTaxes (taxSpecMap, unitTaxSpecificationArray) {
  // Add the taxes to the map
  foreach (taxChargeSpecification : unitTaxSpecificationArray) {
    taxSpecMap[taxChargeSpecification.name] = addTaxes(taxSpecMap[taxChargeSpecification.name], taxChargeSpecification);
  }
}

function addTaxes(x, y) {
  // If one is null, return the other
  if (x == null || y == null) return x || y;

  // Check that taxes are compatible
  if (x.name != y.name) {
    throw "Different types of taxes cannot be added together";
  }
  if (x.rate != y.rate) {
    throw "Taxes with the same name must have the same rate";
  }
  if (x.priceCurrency != y.priceCurrency) {
    throw "Taxes with the same name must have the same currency";
  }

  // If compatible, return
  return {
    "type": "TaxChargeSpecification",
    "name": x.name,
    "price": x.price + y.price,
    "priceCurrency": x.priceCurrency,
    "rate": x.rate
  }
}

function augmentOrderWithTotals(orderQuote) {
  // Calculate total payment due
  var totalPaymentDuePrice = 0;
  var totalPaymentDueCurrency = null;
  var totalPaymentTaxMap = {};

  foreach (orderedItem : orderedItems) {
    // Only items with no errors associated are included in the total price
    if (orderedItem.error.count == 0) {
      totalPaymentDuePrice += orderedItem.acceptedOffer.price;
      if (totalPaymentDueCurrency == null) {
        totalPaymentDueCurrency = orderedItem.acceptedOffer.priceCurrency;
      } else if (totalPaymentDueCurrency != orderedItem.acceptedOffer.priceCurrency) {
        throw "All currencies in an Order must match"
      }
      mergeAndAddTaxes(totalPaymentTaxMap, orderedItem.unitTaxSpecification);
    }
  }

  draftOrderQuote.totalPaymentTax = getTaxArrayFromMap(totalPaymentTaxMap);

  // If we're in Net taxmode, tax must be added to get the total price
  if (orderQuote.seller.taxMode == "https://openactive.io/TaxNet")
  {
    totalPaymentDuePrice += sum ( totalPaymentTax[].price );
  }

  draftOrderQuote.totalPaymentDue = {
    "type": "PriceSpecification",
    "price": totalPaymentDuePrice,
    "priceCurrency": totalPaymentDueCurrency
  };
  
}

  // Check for a 'bookable' Opportunity and Offer pair
  // https://www.openactive.io/open-booking-api/EditorsDraft/#definition-of-a-bookable-opportunity-and-offer-pair
function checkBookable(offer, opportunity) {
  // availableChannel of the Offer includes https://openactive.io/OpenBookingPrepayment.

  // advanceBooking of the Offer is not equal to https://openactive.io/Unavailable.
 
  // The Offer is current based on validFromBeforeStartDate.

  // The endDate is not already in the past (note that bookings are still possible after the startDate).

  // The eventStatus of the Event, ScheduledSession, or Slot is not https://schema.org/EventCancelled or https://schema.org/EventPostponed.

  // The remainingAttendeeCapacity or remainingUses is greater than the number required.

  // The validFromBeforeStartDate duration (if provided) subtracted from the startDate in the past. This allows for a "bookahead" window to be specified.

  // The taxMode (https://openactive/TaxNet or https://openactive/TaxGross) is specified within the Organization that is included in the required organizer or provider properties.
}

// Validate OrderItems, to ensure that output is always valid
// Always throws on error
function validateOutputOrderItem(checkpointStage, orderItem) {
  if (checkpointStage == "C1" || checkpointStage == "C2") {
    if (exists(orderedItem.orderItemStatus)) {
      throw "All OrderItems must not have a status for C1 or C2"
    } 
  }
  if (checkpointStage == "B") {
    if (orderItemStatus != "https://openactive.io/OrderConfirmed") {
      throw "All OrderItems must not have a status OrderConfirmed for B"
    }
  }

  // Validate acceptedOffers
  checkRequiredFieldsExist(orderedItem.acceptedOffer, ["id", "price", "priceCurrency", "availableChannel"]);

  // Validate orderedItem
  if (orderedItem.orderedItem.type != subclassof("Event")) {
    throw "Only Opportunities of Event, ScheduledSession, HeadlineEvent, Slot or CourseInstance are bookable";
  }
  checkRequiredFieldsExist(orderedItem.orderedItem, ["id", "startDate"])
  if (orderedItem.orderedItem.type == oneof(["Event", "ScheduledSession", "HeadlineEvent"])) {
    checkRequiredFieldsExist(orderedItem.orderedItem.superEvent, ["id", "name", "location"]);
  } else if (orderedItem.orderedItem.type == "Slot") {
    checkRequiredFieldsExist(orderedItem.orderedItem.facilityUse, ["id", "name", "location"]);
  } else if (orderedItem.orderedItem.type == "CourseInstance") {
    checkRequiredFieldsExist(orderedItem.orderedItem, ["name", "location"]);
  }
}


// Augment the orderItem with errors based on the input data, based on the stage
function validateDetailsCapture(checkpointStage, orderItem) {
  // Reflect back only those customer fields that are supported
  orderItem.attendee = getAttendeeSupportedFields(orderItem.attendee);

  // Only validate details if at C2 or B
  if (checkpointStage == "C2" || checkpointStage == "B") {
    if (!checkRequiredFieldsExist(orderItem.attendee, orderItem.attendeeDetailsRequired)) {
      orderItem.error[] += renderError("IncompleteAttendeeDetailsError", getMissingFieldsAsString() );  
    }

    var orderItemIntakeFormMap = hashmapBy("id", orderItemIntakeForm);

    // Check only all required responses are included
    requiredAnswerIds = orderItem.orderItemIntakeForm.Where(x => x.valueRequired).Select(x => x.id);
    providedAnswerIds = orderItem.orderItemIntakeFormResponse.Where(x => !x.value.isNullOrEmptyString()).Select(x => x.propertyID);
    if (requiredAnswerIds.Except(providedAnswerIds).Count > 0) {
      orderItem.error[] += renderError("IncompleteIntakeFormError", getMissingFormFieldsAsString() );  
    }

    // Validate each of the fields in the intake form, returning appropriate errors
    foreach (orderItemIntakeFormResponse : orderItem.orderItemIntakeFormResponse) {
      var fieldDefinition = orderItemIntakeFormMap[orderItemIntakeFormResponse.propertyID];

      if (fieldDefinition == null) {
        orderItem.error[] += renderError("ExcessiveIntakeFormError", orderItemIntakeFormResponse.propertyID );  
      } else if  (fieldDefinition.type == "BooleanFormFieldSpecification" && typeof(orderItemIntakeFormResponse.value) != boolean) {
        orderItem.error[] += renderError("InvalidIntakeFormError", orderItemIntakeFormResponse.propertyID );  
      } else if (fieldDefinition.type == "DropdownFormFieldSpecification" && !(fieldDefinition.valueRequired == false && orderItemIntakeFormResponse.value == null ) && !(orderItemIntakeFormResponse.value in fieldDefinition.valueOption))
        orderItem.error[] += renderError("InvalidIntakeFormError", orderItemIntakeFormResponse.propertyID );  
      }
    }
  }

  return orderItem;
}

function renderError(errorCode, string) {

}

function renderDatasetSite(dataset) {

}

// This calls renderDatasetSite with some prepopulated JSON based on simple instructions
// Booleans for includeXFeed
function renderSimpleDatasetSite(name, organisationName,
  includeScheduledSessionFeed, includeSessionSeriesFeed, includeEventFeed, includeCourseInstanceFeed,
  datasetSiteUrl, datasetSiteDiscussionUrl, legalEntity, plainTextDescription, email,
  organisationUrl, organisationLogoUrl, backgroundImageUrl, openDataBaseUrl, bookingBaseUrl) {
  
}


// TODO is this just one large OpenBookingRequestHandler class, which can be overridden


function outputOrderFeedPage(modified,id) {
  //TODO: Add RPDE stuff in here

  // Include a function to map from database to output (not including session info)
}

//TODO: list of triggers:
// - Cancel event


// Note this operation should be atomic
function processCancellation (order) {
  // validate that request only contains "orderItemStatus": "https://openactive.io/CustomerCancelled", and minimal content (otherwise error PatchContainsExcessiveProperties)

  var data = fetchCancellationData(orderId,  authKey, order.orderedItem );

  var orderedItems = order.orderedItem.Select(x => getOrderItemById(x.id, data));

  //TODO: Check all orderedItems are valid for cancellation
  // If allowCustomerCancellationFullRefund is true and latestCancellationBeforeStartDate subtracted from the Opportunity startDate is in the future
  // Return CancellationNotPermittedError

  // Attempt cancellation, and return success or CancellationNotPermittedError with description
  attemptCancellation(order)
}


function processCheckpoint (orderQuote, orderQuoteId, authKey) {

  var checkpointStage = orderQuote.customer ? "C2" : "C1";

  // Get authkey being used the access the Open Booking API 
  var authKey = getAuthKey();

  // Get data for checkpoint (optional optimisation to load the data in one place)
  var data = fetchCheckpointData(orderId,  authKey, orderQuote.orderedItem );

  // Check that taxMode is set in Seller
  if (!seller.id)
  {
    return renderError("SellerNotSpecified");
  }

  // Get seller info
  var seller = getSeller(authKey, orderQuote.seller.id, data);

  // Check that taxMode is set in Seller
  if (!(seller.taxMode == "https://openactive/TaxGross" || seller.taxMode == "https://openactive/TaxNet"))
  {
    throw "taxMode must always be set in the Seller";
  }

  // Get the booking service info (usually static for the booking system)
  var bookingService = getBookingService(data);

  // Reflect back only those customer fields that are supported
  var customer = getCustomerSupportedFields(orderQuote.customer)

  // Reflect back only those broker fields that are supported
  var broker = getBrokerSupportedFields(orderQuote.broker)

  var taxPayeeRelationship = orderQuote.brokerRole == "https://openactive.io/ResellerBroker" 
    || customer.type == "Organisation" ? "B2B" : "B2C";
  
  var payer = orderQuote.brokerRole == "https://openactive.io/ResellerBroker" ? orderQuote.broker : orderQuote.customer;

  // Map all requested OrderedItems to their full details, and validate any details provided if at C2
  var orderedItems = orderQuote.orderedItem.Select(x => 
    // Validate input OrderItem
    {
      if (x.acceptedOffer && x.orderedItem) {
        var fullOrderItem = getOrderItem(x, seller, taxPayeeRelationship, data);

        var sellerId = fullOrderItem.organizer.id || fullOrderItem.superEvent.organizer.id || fullOrderItem.facilityUse.organizer.id || fullOrderItem.superEvent.superEvent.organizer.id;

        if (seller.id != sellerId) {
          x.error[] += renderError("OpportunitySellerMismatch", notBookableReason);    
          return x;
        }

        // Validate output, and throw on error
        validateOutputOrderItem(fullOrderItem);

        // Check for a 'bookable' Opportunity and Offer pair was returned
        var notBookableReason = validateBookable(fullOrderItem);
        if (notBookableReason) {
          x.error[] += renderError("OpportunityOfferPairNotBookable", notBookableReason);    
          return x;
        } else {
          // Note: only validating details if the output is valid (previous check)
          return validateDetailsCapture(checkpointStage, fullOrderItem);
        }
      } else {
        x.error[] += renderError("IncompleteOrderItemError");  
        return x;
      }
    } 
  );

  if (checkpointStage == "C1" || checkpointStage == "C2") {
    var draftOrderQuote = {
      "@context": "https://openactive.io/",
      "type": "OrderQuote",
      "identifier": orderQuoteId,
      "brokerRole": orderQuote.brokerRole,
      "broker": broker,
      "seller": seller,
      "customer": customer,
      "bookingService": bookingService
    };
    
    // Attempt to retrieve lease, or at a minimum check the items can be purchased together (are not conflicted)
    // Note leaseOrCheckBookable adds errors to the orderedItems supplied array
    draftOrderQuote.lease = leaseOrCheckBookable(mutable orderedItems, draftOrderQuote, checkpointStage, seller.taxMode, taxPayeeRelationship, payer, authKey, data );
    
    // TODO: leases need to be set at the beginning, as they'll influence remaining spaces and OpportunityIsFullError etc. 

    // Add orderItems and totals to draftOrderQuote
    draftOrderQuote.orderedItems = orderedItems;
    augmentOrderWithTotals(draftOrderQuote);
    return draftOrderQuote;
  }

  if (checkpointStage == "B") {
    var payment = getPaymentSupportedFields(orderQuote.payment)

    var draftOrder = {
      "@context": "https://openactive.io/",
      "type": "Order",
      "identifier": orderQuoteId,
      "brokerRole": orderQuote.brokerRole,
      "broker": broker,
      "seller": seller,
      "customer": customer,
      "bookingService": bookingService,
      "orderedItems": orderedItems,
      "payment": payment
    };
    augmentOrderWithTotals(draftOrder);

    // Check that draftOrder matches expected totalPaymentDue provided with input order
    if (draftOrder.totalPaymentDue.price != orderQuote.totalPaymentDue.price) {
      return renderError("TotalPaymentDueMismatchError");
    }

    // Add orderItem.id, orderItem.accessCode and orderItem.accessToken for successful booking
    // Note this needs to store enough data to contract an Orders feed entry
    processBooking(draftOrder, checkpointStage, seller.taxMode, taxPayeeRelationship, payer, authKey, data);

    return draftOrder;
  }
  

  var response = {
    "@context": "https://openactive.io/",
    "type": "OrderQuote",
    "brokerRole": orderQuote.brokerRole,
    "broker": broker,
    "seller": seller,
    "customer": customer,
    "bookingService": bookingService,
    "lease": lease,
    "orderedItem": [
      {
        "type": "OrderItem",
        "orderItemStatus": "https://openactive.io/OrderConfirmed",
        "allowCustomerCancellationFullRefund": true,
        "unitTaxSpecification": [
          {
            "type": "TaxChargeSpecification",
            "name": "VAT at 0% for EU transactions",
            "price": 1,
            "priceCurrency": "GBP",
            "rate": 0.2
          }
        ],
        "acceptedOffer": {
          "type": "Offer",
          "id": "https://example.com/events/452#/offers/878",
          "description": "Winger space for Speedball.",
          "name": "Speedball winger position",
          "price": 10,
          "priceCurrency": "GBP",
          "validFromBeforeStartDate": "P6D",
          "latestCancellationBeforeStartDate": "P1D"
        },
        "orderedItem": {
          "type": "ScheduledSession",
          "identifier": 123,
          "id": "https://example.com/events/452/subEvents/132",
          "eventStatus": "https://schema.org/EventScheduled",
          "maximumAttendeeCapacity": 30,
          "remainingAttendeeCapacity": 20,
          "startDate": "2018-10-30T11:00:00Z",
          "endDate": "2018-10-30T12:00:00Z",
          "duration": "PT1H",
          "superEvent": {
            "type": "SessionSeries",
            "id": "https://example.com/events/452",
            "name": "Speedball",
            "duration": "PT1H",
            "organizer": {
              "type": "Organization",
              "name": "Central Speedball Association",
              "url": "http://www.speedball-world.com"
            },
            "location": {
              "type": "Place",
              "url": "https://www.everyoneactive.com/centres/Middlesbrough-Sports-Village",
              "name": "Middlesbrough Sports Village",
              "identifier": "0140",
              "address": {
                "type": "PostalAddress",
                "streetAddress": "Alan Peacock Way",
                "addressLocality": "Village East",
                "addressRegion": "Middlesbrough",
                "postalCode": "TS4 3AE",
                "addressCountry": "GB"
              },
              "geo": {
                "type": "GeoCoordinates",
                "latitude": 54.543964,
                "longitude": -1.20978500000001
              }
            }
          }
        },
        "error": [
          {
            "type": "OpportunityIsFullError",
            "description": "There are no spaces remaining in this opportunity"
          }
        ]
      }
    ],

  }

}
