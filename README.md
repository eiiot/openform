# openform

A free, super simple, hosted API for programatically accessing Google Forms. _Heavily_ inspired by Ben Borgers' [opensheet](https://github.com/benborgers/opensheet).

**Tutorial blog post:** Coming soon™

## Documentation

This API has two methods: `GET` and `POST`.

In order to use it:

1. Ensure your form's email collection setting is set to either "Do not collect" or "Responder input".
2. Ensure your form does not require a file upload, as that forces users to sign in to Google.
3. Get the sharing url of your Google Form.
4. Get the `id` (It's between `/e/` and `/viewform`)

The format for this API is:

```
https://openform.eliot.sh/form_id
```

For example:

```
https://openform.eliot.sh/1FAIpQLSdvhi8-Y0eKOKs2R_1sVbwDT-1JvHEYhbUr1BoFFa7kWpyqyg
```

## `GET` method

The `GET` method returns form information, and is useful for getting question IDs. It returns a JSON object with the following schema:

```
{
    title: string;
    description: string | null;
    collectEmails: "NONE" | "VERIFIED" | "INPUT";
    questions: {
      title: string;
      description: string | null;
      type: "TEXT" | "PARAGRAPH_TEXT" | "MULTIPLE_CHOICE" | "CHECKBOXES" | "DROPDOWN" | "DATE" | "TIME" | "SCALE" | "GRID" | "FILE_UPLOAD"
      options: string[];
      required: boolean;
      id: string;
    }[];
    error: false;
}
```

The options array for `GRID` questions will only display the column options, not the row options.

## `POST` method

The `POST` method submits a response to the form. It takes a JSON object with the following schema:

```
{
    [questionId: string]: string | string[]; // Use an array for CHECKBOXES questions
    emailAddress?: string; // Only required if the form is set to collect emails
}
```

At the moment, openform does not support `FILE_UPLOAD`, `DATE`, `TIME` or `GRID` questions. For almost all collection, a `TEXT` question should be sufficient.

## Caching

Responses are cached for 30 seconds in order to improve performance and to avoid hitting Google Forms’ rate limits, so it might take up to 30 seconds for fresh edits to show up in the API response.
