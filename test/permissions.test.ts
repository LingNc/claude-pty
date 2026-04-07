import { describe, it, expect } from 'bun:test'
import {
  initPermissions,
  checkCommandPermission,
  checkWorkdirPermission,
} from '../src/permissions.js'

describe('Permissions', () => {
  describe('initPermissions', () => {
    it('should initialize without error', () => {
      expect(() => initPermissions('/project')).not.toThrow()
    })
  })

  describe('checkCommandPermission', () => {
    it('should allow commands when no config is set', async () => {
      // Should not throw
      await checkCommandPermission('ls', ['-la'])
    })

    it('should allow simple commands', async () => {
      await checkCommandPermission('echo', ['hello'])
      await checkCommandPermission('pwd', [])
    })

    it('should handle commands with arguments', async () => {
      await checkCommandPermission('git', ['status'])
      await checkCommandPermission('npm', ['run', 'dev'])
    })
  })

  describe('checkWorkdirPermission', () => {
    it('should allow workdir within project directory', async () => {
      initPermissions('/home/project')
      // Same directory
      await checkWorkdirPermission('/home/project')
      // Subdirectory
      await checkWorkdirPermission('/home/project/src')
    })

    it('should allow workdir with trailing slash', async () => {
      initPermissions('/home/project/')
      await checkWorkdirPermission('/home/project')
      await checkWorkdirPermission('/home/project/src')
    })

    it('should handle workdir with trailing slash', async () => {
      initPermissions('/home/project')
      await checkWorkdirPermission('/home/project/')
      await checkWorkdirPermission('/home/project/src/')
    })

    it('should allow workdir when project directory not initialized', async () => {
      // Reset by calling initPermissions with empty string
      initPermissions('')
      await checkWorkdirPermission('/any/path')
    })
  })
})
