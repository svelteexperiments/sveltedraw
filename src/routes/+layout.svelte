<script lang="ts">
  import "../app.css";
  let { children } = $props();
</script>

<svelte:head>
  <title>Svelte Whiteboard</title>
</svelte:head>
{@render children()}
