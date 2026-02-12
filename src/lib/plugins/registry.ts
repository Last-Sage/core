"use client";

import { PluginSDK, PluginManifest, PluginComponent, PluginEventHandler } from "./types";

/**
 * Global plugin registry
 * Plugins register themselves here at runtime
 */
class PluginRegistryClass {
  private plugins: Map<string, PluginSDK> = new Map();
  private eventHandlers: Map<string, PluginEventHandler[]> = new Map();

  /**
   * Register a plugin
   */
  register(plugin: PluginSDK): void {
    const { id } = plugin.manifest;
    
    if (this.plugins.has(id)) {
      console.warn(`Plugin ${id} is already registered, overwriting...`);
    }
    
    this.plugins.set(id, plugin);
    
    // Register event handlers
    for (const sub of plugin.subscriptions) {
      const handlers = this.eventHandlers.get(sub.eventType) || [];
      handlers.push(sub.handler);
      this.eventHandlers.set(sub.eventType, handlers);
    }
    
    console.log(`Plugin registered: ${plugin.manifest.name} v${plugin.manifest.version}`);
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Remove event handlers
    for (const sub of plugin.subscriptions) {
      const handlers = this.eventHandlers.get(sub.eventType) || [];
      const filtered = handlers.filter((h) => h !== sub.handler);
      this.eventHandlers.set(sub.eventType, filtered);
    }

    this.plugins.delete(pluginId);
    console.log(`Plugin unregistered: ${pluginId}`);
  }

  /**
   * Get a registered plugin
   */
  get(pluginId: string): PluginSDK | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all registered plugins
   */
  getAll(): PluginSDK[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all plugin manifests
   */
  getManifests(): PluginManifest[] {
    return this.getAll().map((p) => p.manifest);
  }

  /**
   * Get all routes from all plugins
   */
  getAllRoutes(): PluginComponent[] {
    return this.getAll().flatMap((p) => p.routes);
  }

  /**
   * Get all nav items from all plugins
   */
  getAllNavItems(): PluginManifest["nav"] {
    return this.getAll()
      .flatMap((p) => p.manifest.nav || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Emit an event to all subscribed plugins
   */
  async emit(eventType: string, payload: Record<string, unknown>): Promise<void> {
    const handlers = this.eventHandlers.get(eventType) || [];
    
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(payload);
        } catch (error) {
          console.error(`Plugin event handler error for ${eventType}:`, error);
        }
      })
    );
  }

  /**
   * Check if a plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get plugin count
   */
  get size(): number {
    return this.plugins.size;
  }
}

// Singleton instance
export const PluginRegistry = new PluginRegistryClass();
