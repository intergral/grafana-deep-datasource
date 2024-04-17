# Proto definition

This package contains some definitions of proto compiled files. These files are not part of deep-proto (yet).

For now, we have simply copied the generated source
from [deep.pg.go](https://github.com/intergral/deep/blob/master/pkg/deeppb/deep.pb.go)

if updating the source - copy the full source from deep then update the imports for tracepoing and poll to use the real version.

e.g.

```go
v11 "github.com/intergral/go-deep-proto/poll/v1"
v1 "github.com/intergral/go-deep-proto/tracepoint/v1"
```
