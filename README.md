# Jellyfish Metrics

This library gathers Prometheus metrics and exposes them to be scraped by balena-monitor.

# Usage

Below is an example how to use this library:

```js
const metrics = require('@balena/jellyfish-metrics')

// Start server to expose gathered metrics data.
metrics.startServer(context, portNumber)

// Mark that a card was read from the database.
metrics.markCardReadFromDatabase(card)
```

# Documentation

- [**Adding metrics**](https://github.com/product-os/jellyfish-metrics/blob/master/doc/adding-metrics.markdown)

A module that gathers and exposes Prometheus metrics.


* [metrics](#module_metrics)
    * _static_
        * [.toSeconds(ms)](#module_metrics.toSeconds) ⇒ <code>Number</code>
        * [.initExpress(context)](#module_metrics.initExpress) ⇒ <code>Object</code>
        * [.startServer(context, port)](#module_metrics.startServer)
        * [.markCardInsert(card)](#module_metrics.markCardInsert)
        * [.markCardUpsert(card)](#module_metrics.markCardUpsert)
        * [.markCardReadFromDatabase(card)](#module_metrics.markCardReadFromDatabase)
        * [.markCardReadFromCache(card)](#module_metrics.markCardReadFromCache)
        * [.markBackSync(integration)](#module_metrics.markBackSync)
        * [.markActionRequest(action)](#module_metrics.markActionRequest)
        * [.markQueueConcurrency()](#module_metrics.markQueueConcurrency)
        * [.markJobAdd(action, id)](#module_metrics.markJobAdd)
        * [.markJobDone(action, id, timestamp)](#module_metrics.markJobDone)
        * [.measureMirror(integration, fn)](#module_metrics.measureMirror) ⇒ <code>Any</code>
        * [.measureTranslate(integration, fn)](#module_metrics.measureTranslate) ⇒ <code>Any</code>
        * [.measureHttpQuery(fn)](#module_metrics.measureHttpQuery) ⇒ <code>Any</code>
        * [.measureHttpType(fn)](#module_metrics.measureHttpType) ⇒ <code>Any</code>
        * [.measureHttpId(fn)](#module_metrics.measureHttpId) ⇒ <code>Any</code>
        * [.measureHttpSlug(fn)](#module_metrics.measureHttpSlug) ⇒ <code>Any</code>
        * [.measureHttpAction(fn)](#module_metrics.measureHttpAction) ⇒ <code>Any</code>
        * [.measureHttpWhoami(fn)](#module_metrics.measureHttpWhoami) ⇒ <code>Any</code>
        * [.markSqlGenTime(ms)](#module_metrics.markSqlGenTime)
        * [.markQueryTime(ms)](#module_metrics.markQueryTime)
        * [.markStreamOpened(context, table)](#module_metrics.markStreamOpened)
        * [.markStreamClosed(context, table)](#module_metrics.markStreamClosed)
        * [.markStreamLinkQuery(context, table, change)](#module_metrics.markStreamLinkQuery)
        * [.markStreamError(context, table)](#module_metrics.markStreamError)
    * _inner_
        * [~measureAsync(name, labels, fn)](#module_metrics..measureAsync) ⇒ <code>Any</code>
        * [~isCard(card)](#module_metrics..isCard) ⇒ <code>Boolean</code>
        * [~actorFromContext(context)](#module_metrics..actorFromContext) ⇒ <code>String</code>
        * [~getAsyncMeasureFn(prefix)](#module_metrics..getAsyncMeasureFn) ⇒ <code>Any</code>

<a name="module_metrics.toSeconds"></a>

### metrics.toSeconds(ms) ⇒ <code>Number</code>
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Convert milliseconds to seconds  
**Returns**: <code>Number</code> - seconds with fixed point notation of 4  

| Param | Type | Description |
| --- | --- | --- |
| ms | <code>Number</code> | milliseconds |

**Example**  
```js
const seconds = toSeconds(ms)
```
<a name="module_metrics.initExpress"></a>

### metrics.initExpress(context) ⇒ <code>Object</code>
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Create express app using metrics and expose data on /metrics  
**Returns**: <code>Object</code> - express app  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Object</code> | execution context |

**Example**  
```js
const application = metrics.initExpress(context)
```
<a name="module_metrics.startServer"></a>

### metrics.startServer(context, port)
Expose gathered metrics on /metrics
Reassign port to random port number on collision

**Kind**: static method of [<code>metrics</code>](#module_metrics)  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Object</code> | execution context |
| port | <code>Number</code> | port to expose metrics on |

**Example**  
```js
metrics.startServer(context, 9000)
```
<a name="module_metrics.markCardInsert"></a>

### metrics.markCardInsert(card)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that a card was inserted  

| Param | Type | Description |
| --- | --- | --- |
| card | <code>Object</code> | card that was inserted |

**Example**  
```js
metrics.markCardInsert(card)
```
<a name="module_metrics.markCardUpsert"></a>

### metrics.markCardUpsert(card)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that a card was upserted  

| Param | Type | Description |
| --- | --- | --- |
| card | <code>Object</code> | card that was upserted |

**Example**  
```js
metrics.markCardUpsert(card)
```
<a name="module_metrics.markCardReadFromDatabase"></a>

### metrics.markCardReadFromDatabase(card)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that a card was read from the database  

| Param | Type | Description |
| --- | --- | --- |
| card | <code>Object</code> | card that was read the database |

**Example**  
```js
metrics.markCardReadFromDatabase(card)
```
<a name="module_metrics.markCardReadFromCache"></a>

### metrics.markCardReadFromCache(card)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that a card was read from cache  

| Param | Type | Description |
| --- | --- | --- |
| card | <code>Object</code> | card that was read from cache |

**Example**  
```js
metrics.markCardReadFromCache(card)
```
<a name="module_metrics.markBackSync"></a>

### metrics.markBackSync(integration)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that a card has been created due to back-sync  

| Param | Type | Description |
| --- | --- | --- |
| integration | <code>String</code> | name of integration |

**Example**  
```js
metrics.markBackSync('front')
```
<a name="module_metrics.markActionRequest"></a>

### metrics.markActionRequest(action)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that an action request was received  

| Param | Type | Description |
| --- | --- | --- |
| action | <code>String</code> | action name |

**Example**  
```js
metrics.markActionRequest('action-create-card')
```
<a name="module_metrics.markQueueConcurrency"></a>

### metrics.markQueueConcurrency()
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Expose current queue concurrency setting  
**Example**  
```js
metrics.markQueueConcurrency()
```
<a name="module_metrics.markJobAdd"></a>

### metrics.markJobAdd(action, id)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that a new job was added to the queue  

| Param | Type | Description |
| --- | --- | --- |
| action | <code>String</code> | action name |
| id | <code>String</code> | id of the worker |

**Example**  
```js
metrics.markJobAdd('action-create-card', context.id)
```
<a name="module_metrics.markJobDone"></a>

### metrics.markJobDone(action, id, timestamp)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that a job in the queue has completed  

| Param | Type | Description |
| --- | --- | --- |
| action | <code>String</code> | action name |
| id | <code>String</code> | id of the worker |
| timestamp | <code>String</code> | when action was completed |

**Example**  
```js
const action = 'action-create-card'
const timestamp = '2020-06-08T09:33:27.481Z'
metrics.markJobDone(action, context.id, timestamp)
```
<a name="module_metrics.measureMirror"></a>

### metrics.measureMirror(integration, fn) ⇒ <code>Any</code>
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Execute a mirror, marking duration and totals  
**Returns**: <code>Any</code> - mirror result  

| Param | Type | Description |
| --- | --- | --- |
| integration | <code>Object</code> | name of external integration |
| fn | <code>Promise</code> | mirror function to execute |

**Example**  
```js
const result = await metrics.measureMirror('github', mirror())
```
<a name="module_metrics.measureTranslate"></a>

### metrics.measureTranslate(integration, fn) ⇒ <code>Any</code>
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Execute a translate, marking duration and totals  
**Returns**: <code>Any</code> - translate result  

| Param | Type | Description |
| --- | --- | --- |
| integration | <code>Object</code> | name of external integration |
| fn | <code>Promise</code> | mirror function to execute |

**Example**  
```js
const result = await metrics.measureTranslate('github', translate())
```
<a name="module_metrics.measureHttpQuery"></a>

### metrics.measureHttpQuery(fn) ⇒ <code>Any</code>
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Measure the duration of a request to the /query api endpoint  
**Returns**: <code>Any</code> - api result  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>Promise</code> | api function to execute |

<a name="module_metrics.measureHttpType"></a>

### metrics.measureHttpType(fn) ⇒ <code>Any</code>
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Measure the duration of a request to the /type api endpoint  
**Returns**: <code>Any</code> - api result  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>Promise</code> | api function to execute |

<a name="module_metrics.measureHttpId"></a>

### metrics.measureHttpId(fn) ⇒ <code>Any</code>
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Measure the duration of a request to the /id api endpoint  
**Returns**: <code>Any</code> - api result  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>Promise</code> | api function to execute |

<a name="module_metrics.measureHttpSlug"></a>

### metrics.measureHttpSlug(fn) ⇒ <code>Any</code>
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Measure the duration of a request to the /slug api endpoint  
**Returns**: <code>Any</code> - api result  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>Promise</code> | api function to execute |

<a name="module_metrics.measureHttpAction"></a>

### metrics.measureHttpAction(fn) ⇒ <code>Any</code>
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Measure the duration of a request to the /action api endpoint  
**Returns**: <code>Any</code> - api result  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>Promise</code> | api function to execute |

<a name="module_metrics.measureHttpWhoami"></a>

### metrics.measureHttpWhoami(fn) ⇒ <code>Any</code>
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Measure the duration of a request to the /action api endpoint  
**Returns**: <code>Any</code> - api result  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>Promise</code> | api function to execute |

<a name="module_metrics.markSqlGenTime"></a>

### metrics.markSqlGenTime(ms)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark how long it took to generate an SQL query from a JSON schema  

| Param | Type | Description |
| --- | --- | --- |
| ms | <code>Number</code> | number of milliseconds it took to generate the query |

<a name="module_metrics.markQueryTime"></a>

### metrics.markQueryTime(ms)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark how long it took to execute an SQL query  

| Param | Type | Description |
| --- | --- | --- |
| ms | <code>Number</code> | number of milliseconds it took to execute the query |

<a name="module_metrics.markStreamOpened"></a>

### metrics.markStreamOpened(context, table)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that a new stream was opened  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Object</code> | caller context |
| table | <code>String</code> | table name |

**Example**  
```js
metrics.markStreamOpened(context, 'cards')
```
<a name="module_metrics.markStreamClosed"></a>

### metrics.markStreamClosed(context, table)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that a stream was closed  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Object</code> | caller context |
| table | <code>String</code> | table name |

**Example**  
```js
metrics.markStreamClosed(context, 'cards')
```
<a name="module_metrics.markStreamLinkQuery"></a>

### metrics.markStreamLinkQuery(context, table, change)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that a stream is querying links  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Object</code> | caller context |
| table | <code>String</code> | table name |
| change | <code>Object</code> | change event object |

**Example**  
```js
metrics.markStreamLinkQuery(context, change)
```
<a name="module_metrics.markStreamError"></a>

### metrics.markStreamError(context, table)
**Kind**: static method of [<code>metrics</code>](#module_metrics)  
**Summary**: Mark that a stream error has occurred  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Object</code> | caller context |
| table | <code>String</code> | table name |

**Example**  
```js
metrics.markStreamError()
```
<a name="module_metrics..measureAsync"></a>

### metrics~measureAsync(name, labels, fn) ⇒ <code>Any</code>
**Kind**: inner method of [<code>metrics</code>](#module_metrics)  
**Summary**: Measure duration of a promise execution and add to metrics  
**Returns**: <code>Any</code> - promise execution result  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | metric name |
| labels | <code>Object</code> \| <code>Undefined</code> | metric labels |
| fn | <code>Promise</code> | function to execute and measure |

**Example**  
```js
const result = await measureAsync('my_metric', { ... }, myFunction, ...params)
```
<a name="module_metrics..isCard"></a>

### metrics~isCard(card) ⇒ <code>Boolean</code>
**Kind**: inner method of [<code>metrics</code>](#module_metrics)  
**Summary**: Checks if an object looks to be a valid card or not.  
**Returns**: <code>Boolean</code> - validation result, true if card, false if not  

| Param | Type | Description |
| --- | --- | --- |
| card | <code>Object</code> | object to validate |

**Example**  
```js
const result = isCard(card)
```
<a name="module_metrics..actorFromContext"></a>

### metrics~actorFromContext(context) ⇒ <code>String</code>
**Kind**: inner method of [<code>metrics</code>](#module_metrics)  
**Summary**: Extract actor name from context ID  
**Returns**: <code>String</code> - actor name  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Object</code> | caller context |

**Example**  
```js
const actorName = actorFromContext(context)
```
<a name="module_metrics..getAsyncMeasureFn"></a>

### metrics~getAsyncMeasureFn(prefix) ⇒ <code>Any</code>
**Kind**: inner method of [<code>metrics</code>](#module_metrics)  
**Summary**: Generates a generic measurement wrapper for an async function, that
tracks total calls, total failures and duration  
**Returns**: <code>Any</code> - api result  

| Param | Type | Description |
| --- | --- | --- |
| prefix | <code>String</code> | metric name prefix |

