import { mount } from 'svelte';
import App from "../components/Signin.svelte";

const app = mount(App, {
  target: document.body,
});

export default app;