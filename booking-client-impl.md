
Test harness wrapper
---

Env vars:
Store in memory = true
Testing subset of data = true

In Booking System:
Create/update test data

In client:
Create booking system
Create seller

For each booking test (e.g. opportunity full, etc):
Search endpoint to identify specific test opportunity by name
Call C1, C2 and B on test opportunity (random Order UUID)
Assert result
Delete Order
Assert result (GET endpoint of booking system is blank)

For each notification test:
Search endpoint to identify test opportunity by name
Call C1, C2 and B on test opportunity (random Order UUID). Call change of logistics between C1 and C2, and between C2 and B, and after B.
Call either:
- Test harness webhook to trigger provider cancellation or change of logistics by updating booking system
- Cancellation endpoint
Await notification
Assert result


In client:
Destroy seller
Destroy booking system


Go Sweat wrapper
---

Configure authed Sellers for each feed, and associated payment blob

Ingest open data into their own search (good reason for harvester to be separate?), via single RPDE feed of all feeds (or one for each type?)
Call C1, C2 and B with Customer info included and a broker wrapper to define which access they get
Set up webhooks for
- Customer notification webhook
- Payment auth
- Payment capture
- Refund webhook
- Order and Invoice storage against customer account


imin wrapper
---

Call C1, C2 and B with Customer info included and a broker wrapper to define which access they get

PUT `/brokers/{your_broker_id}/orders/{uuid}`

Manages who has permission to book which seller

Allows add and remove of customers

Stores Orders, Invoices and Events against Customers for easy browsing

Allocates payment

