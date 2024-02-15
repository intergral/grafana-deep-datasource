# Configuration

When connecting Grafana to DEEP you need to create and configure a Datasource. Below is a list of the available
configuration options.

## HTTP

This section of the datasource configuration controls the main connection to DEEP.

### URL

This should be the public URL to connect from Grafana to DEEP. This should be in the form of a URL
e.g. `https://deep.example.com:3000`

If using Docker locally this is most likely `http://localhost:3000`, if running Grafana and Deep are in the same docker
network this could be `http://deep:3000`.

### Allowed Cookies

These are the names of the cookies that Grafana should forward with requests.

### Timeout

This is the HTTP request timeout in seconds.

## Auth

This section controls how Grafana will authenticate with DEEP.

Note: Currently DEEP is in early access and does not support auth directly.

## Custom HTTP Headers

Any custom headers to attach to the requests.

## Options

In this section are some options that will enable or disabled specific features of the data source.

### Enable DeepQL Search

DeepQL is an experimental query language that is roughly based on PromQL. The goal is to allow for more fluid
interactions with DEEP to gather, query and display data in a more human way.
