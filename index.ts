import { Serve } from "bun";
import { getFormData } from "./getFormData";
import { submitForm } from "./submitForm";

const CACHE = new Map();

setInterval(() => {
  for (const [id, { expiry }] of CACHE.entries()) {
    if (expiry < new Date()) {
      CACHE.delete(id);
    }
  }
}, 10_000);

const errorResponse = () => {
  return new Response(JSON.stringify({
    error: true,
    message: "An unexpected error occurred. Please contact eliot <at> eliot <dot> sh with your form ID and any other relevant information.",
  }), {
    status: 500,
    statusText: "Internal Server Error",
    headers: {
      "content-type": "application/json;charset=UTF-8",
    }
  });
}

const serveOptions: Serve = {
  fetch(req) {
    switch (req.method) {
      case "GET":
        return getHandler(req)
          .catch((err) => {
            console.error(err);
            return errorResponse();
          });
      case "POST":
        return postHandler(req)
          .catch((err) => {
            console.error(err);
            return errorResponse();
          });
      default:
        const response = {
          error: true,
          message: `Invalid method: ${req.method}`,
        }

        return new Response(JSON.stringify(response), {
          status: 405,
          statusText: "Method Not Allowed",
          headers: {
            "content-type": "application/json;charset=UTF-8",
          }
        });
    }
  },
};

const getHandler = async (req: Request) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/")[1];

  if (!id) {
    return Response.redirect("https://github.com/eiiot/openform", 301);
  }

  console.log(`${id} - GET`);

  if (CACHE.has(id)) {
    const data = CACHE.get(id).data;

    console.log(`${id} - CACHE HIT`);

    console.log(`${id} - RETURNING RESPONSE WITH STATUS ${data.error ? 400 : 200}`);

    return new Response(JSON.stringify(data), {
      status: data.error ? 400 : 200,
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "x-cache": "HIT",
      },
    });
  }

  console.log(`${id} - CACHE MISS`);

  const data = await getFormData(id);

  CACHE.set(id, {
    expiry: new Date(Date.now() + 30_000),
    data,
  });

  console.log(`${id} - CACHE SET`);

  console.log(`${id} - RETURNING RESPONSE WITH STATUS ${data.error ? 400 : 200}`);

  return new Response(JSON.stringify(data), {
    status: data.error ? 400 : 200,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "x-cache": "MISS",
    },
  });
};

const postHandler = async (req: Request) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/")[1];

  if (!id) {
    return Response.redirect("https://github.com/eiiot/openform", 301);
  }

  console.log(`${id} - POST`);

  const contentType = req.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const json = await req.json();

    const submitted = await submitForm(id, json);

    console.log(`${id} - RETURNING RESPONSE WITH STATUS ${submitted.error ? 400 : 200}`);

    return new Response(JSON.stringify(submitted), {
      status: submitted.error ? 400 : 200,
      statusText: submitted.error ? "Bad Request" : "OK",
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    });
  } else if (contentType?.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();

    const data = Object.fromEntries(formData.entries()) as { [key: string]: string };

    const submitted = await submitForm(id, data);

    console.log(`${id} - RETURNING RESPONSE WITH STATUS ${submitted.error ? 400 : 200}`);

    return new Response(JSON.stringify(submitted), {
      status: submitted.error ? 400 : 200,
      statusText: submitted.error ? "Bad Request" : "OK",
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    });
  } else {
    console.log(`${id} - RETURNING RESPONSE WITH STATUS 400`);

    return new Response(`Invalid content type: ${contentType}`, {
      status: 400,
      statusText: "Bad Request",
    });
  }
};

Bun.serve(serveOptions);

console.log("Started server on port", process.env.PORT || 3000);
