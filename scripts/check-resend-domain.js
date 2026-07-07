// Check domain status via Resend API
const res = await fetch("https://api.resend.com/domains", {
  headers: {
    Authorization: "Bearer re_QykfUvq9_6A6i5DpjeW48d3njEUeD3W1k",
    "Content-Type": "application/json",
  },
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
