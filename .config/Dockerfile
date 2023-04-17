ARG grafana_version=latest
ARG grafana_image=grafana-enterprise

FROM grafana/${grafana_image}:${grafana_version}-ubuntu

USER root
WORKDIR /root

RUN apt -y update
RUN apt -y install git build-essential

RUN curl -L https://golang.org/dl/go1.18.linux-amd64.tar.gz > go1.18.linux-amd64.tar.gz

RUN rm -rf /usr/local/go && \
    tar -C /usr/local -xzf go1.18.linux-amd64.tar.gz

RUN touch README; printf "~~~~~~ START THE DLV SERVER WITH THIS COMMAND BEFORE RUNNING IDE DEBUGGER ~~~~~~ \r\ndlv attach --headless --listen=:2345 PID\r\n\r\n" >> README

RUN echo "export PATH=$PATH:/usr/local/go/bin:~/go/bin" >> ~/.bashrc
RUN echo "cat ~/README" >> ~/.bashrc

RUN /usr/local/go/bin/go install github.com/go-delve/delve/cmd/dlv@latest
RUN git clone https://github.com/magefile/mage; \
    cd mage; \
    export PATH=$PATH:/usr/local/go/bin; \
    go run bootstrap.go

# Make it as simple as possible to access the grafana instance for development purposes
# Do NOT enable these settings in a public facing / production grafana instance
ENV GF_AUTH_ANONYMOUS_ORG_ROLE "Admin"
ENV GF_AUTH_ANONYMOUS_ENABLED "true"
ENV GF_AUTH_BASIC_ENABLED "false"
# Set development mode so plugins can be loaded without the need to sign
ENV GF_DEFAULT_APP_MODE "development"

# Inject livereload script into grafana index.html
USER root
RUN sed -i 's/<\/body><\/html>/<script src=\"http:\/\/localhost:35729\/livereload.js\"><\/script><\/body><\/html>/g' /usr/share/grafana/public/views/index.html