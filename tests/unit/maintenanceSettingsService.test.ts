/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest'
import * as ms from '../../src/services/maintenanceSettingsService'

describe('maintenanceSettingsService runtime guards', () => {
  it('exports MAINTENANCE_SETTINGS_ENABLED as a boolean and does not throw', () => {
    expect(typeof ms.MAINTENANCE_SETTINGS_ENABLED).toBe('boolean')
  })
})