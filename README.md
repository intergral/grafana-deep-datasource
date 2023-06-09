# Intergral-Deep-Datasource Plugin

This is a plugin for [Grafana](https://grafana.com) that allows for connections to
the [Deep](https://github.com/intergral/deep).

## Usage

Currently, this plugin is not available on the Grafana marketplace. So to use this plugin you need to manually install
it.

## Installation

To install this plugin into Grafana follow the steps below:

1. Build the plugin
   1. Either build from source or
   2. Download the latest release from [Github](https://github.com/intergral/grafana-deep-datasource/releases)
2. Unzip or copy the build output to the plugins directory for Grafana (In docker this is /var/lib/grafana/plugins/)
3. Now do the same for [intergral-deep-panel](https://github.com/intergral/grafana-deep-panel)
4. As this is currently unsigned you need to add an exception to Grafana.
   1. Add the line `allow_loading_unsigned_plugins = intergral-deep-panel,intergral-deep-datasource` to `grafana.ini` (
      In docker this is /etc/grafana/grafana.ini)
   2. Here we hae also added the allowance for the panel plugin that this plugin requires. 
5. Now start Grafana and you will be able to add Deep as a datasource.

## Using Docker
If you are building a container with docker then you can simply use the pre-built [image]().

### Existing builds
If you are already building a custom docker image for Grafana then you can use docker build layers to add Deep.

```dockerfile
# Add our image as a build layer
FROM intergral/grafana-deep:latest as deep

# Now continue your build
FROM grafana/grafana
# Copy our plugins from the deep image
COPY --from=deep /var/lib/grafana/plugins/ /var/lib/grafana/plugins/
# Copy the grafana .ini from the deep image
# If you have your own custom grafana.ini, add 
# allow_loading_unsigned_plugins = intergral-deep-panel,intergral-deep-datasource to your file and remove the next line
COPY --from=deep /etc/grafana/grafana.ini /etc/grafana/grafana.ini
```
