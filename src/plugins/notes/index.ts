/**
 * Notes Plugin - Sample Plugin Implementation
 * Demonstrates the plugin SDK pattern
 */

import type { PluginSDK } from "@/lib/plugins/types";
import manifest from "./manifest.json";

// Plugin SDK implementation
export const NotesPlugin: PluginSDK = {
  manifest: {
    ...manifest,
    nav: manifest.nav as PluginSDK["manifest"]["nav"],
  },

  routes: [
    // Routes would be registered here
    // { Component: NotesListPage, path: "/notes", permission: "notes:read" },
    // { Component: NoteEditorPage, path: "/notes/:id", permission: "notes:read" },
  ],

  subscriptions: [
    {
      eventType: "user.created",
      handler: async (payload) => {
        console.log("Notes plugin: New user created", payload);
        // Could create default folders for new users
      },
    },
  ],

  onEnable: async () => {
    console.log("Notes plugin enabled");
    // Initialize plugin resources
  },

  onDisable: async () => {
    console.log("Notes plugin disabled");
    // Cleanup plugin resources
  },
};

export default NotesPlugin;
