# Class Import Samples

Use these sample files with:

```text
POST http://localhost:8070/edmanage-class/import
```

In Postman, select `Body` -> `form-data`:

- Key: `attachment`, Type: `File`, Value: choose one sample file.
- Optional key: `type`, Type: `Text`, Value: `json`, `csv`, `xml`, or `xlsx`.

If `type` is omitted, the API uses the uploaded file extension.
