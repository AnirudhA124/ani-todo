import { mount } from 'svelte';
import App from "../components/CreateUser.svelte";

const app = mount(App, {
  target: document.body,
});

export default app;