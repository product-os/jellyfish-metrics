# Jellyfish Metrics

This library gathers Prometheus metrics and exposes them to be scraped by [balena-monitor](https://github.com/balena-io/balena-monitor).
Jellyfish production metrics can be found in [this dashboard](https://monitor.balena-cloud.com/d/jellyfish/jellyfish?orgId=1).

# Usage

Below is an example how to use this library:

```typescript
import * as metrics from '@balena/jellyfish-metrics';

// Start server to expose gathered metrics data.
metrics.startServer(context, portNumber);

// Mark that a card was read from the database.
metrics.markCardReadFromDatabase(card);
```

# Documentation

- [**Adding metrics**](https://github.com/product-os/jellyfish-metrics/blob/master/doc/adding-metrics.markdown)

Visit the website for complete documentation: https://product-os.github.io/jellyfish-metrics
