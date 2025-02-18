import * as core from '@actions/core'
import glob from 'glob'

export async function checkExistence(pattern: string): Promise<boolean> {
  const globOptions = {
    follow: !(
      (core.getInput('follow_symlinks') || 'true').toUpperCase() === 'FALSE'
    ),
    nocase: (core.getInput('ignore_case') || 'false').toUpperCase() === 'TRUE'
  }
  return new Promise((resolve, reject) => {
    glob(pattern, globOptions, (err: unknown, files: string[]) => {
      if (err) {
        reject(err)
      } else {
        resolve(files.length > 0)
      }
    })
  })
}

async function run(): Promise<void> {
  try {
    const files: string = core.getInput('files', {required: true})
    const failure: boolean =
      (core.getInput('allow_failure') || 'false').toUpperCase() === 'TRUE'
    const fileList: string[] = files
      .split(',')
      .map((item: string) => item.trim())
    const missingFiles: string[] = []

    // Check in parallel
    await Promise.all(
      fileList.map(async (file: string) => {
        const isPresent = await checkExistence(file)
        if (isPresent) {
          missingFiles.push(file)
        }
      })
    )

    if (missingFiles.length > 0) {
      if (failure) {
        core.setFailed(`Unexpected file types in your repo: ${missingFiles.join(', ')}`)
      } else {
        core.info(`Unexpected file types in your repo: ${missingFiles.join(', ')}`)
      }
      core.setOutput('files_exists', 'true')
    } else {
      core.info('🎉 No files exist')
      core.setOutput('files_exists', 'false')
    }
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error
    }
    core.setFailed(error.message)
  }
}

run()
