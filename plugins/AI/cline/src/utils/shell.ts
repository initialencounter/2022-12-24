import { userInfo } from "os"

const SHELL_PATHS = {
	// Windows paths
	POWERSHELL_7: "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
	POWERSHELL_LEGACY: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
	CMD: "C:\\Windows\\System32\\cmd.exe",
	WSL_BASH: "/bin/bash",
	// Unix paths
	MAC_DEFAULT: "/bin/zsh",
	LINUX_DEFAULT: "/bin/bash",
	CSH: "/bin/csh",
	BASH: "/bin/bash",
	KSH: "/bin/ksh",
	SH: "/bin/sh",
	ZSH: "/bin/zsh",
	DASH: "/bin/dash",
	TCSH: "/bin/tcsh",
	FALLBACK: "/bin/sh",
} as const


// -----------------------------------------------------
// 1) VS Code Terminal Configuration Helpers
// -----------------------------------------------------



// -----------------------------------------------------
// 2) Platform-Specific VS Code Shell Retrieval
// -----------------------------------------------------

/** Attempts to retrieve a shell path from VS Code config on Windows. */
function getWindowsShellFromVSCode(): string | null {
	return null
}

/** Attempts to retrieve a shell path from VS Code config on macOS. */
function getMacShellFromVSCode(): string | null {
	return null
}

/** Attempts to retrieve a shell path from VS Code config on Linux. */
function getLinuxShellFromVSCode(): string | null {
	return null
}

// -----------------------------------------------------
// 3) General Fallback Helpers
// -----------------------------------------------------

/**
 * Tries to get a user’s shell from os.userInfo() (works on Unix if the
 * underlying system call is supported). Returns null on error or if not found.
 */
function getShellFromUserInfo(): string | null {
	try {
		const { shell } = userInfo()
		return shell || null
	} catch {
		return null
	}
}

/** Returns the environment-based shell variable, or null if not set. */
function getShellFromEnv(): string | null {
	const { env } = process

	if (process.platform === "win32") {
		// On Windows, COMSPEC typically holds cmd.exe
		return env.COMSPEC || "C:\\Windows\\System32\\cmd.exe"
	}

	if (process.platform === "darwin") {
		// On macOS/Linux, SHELL is commonly the environment variable
		return env.SHELL || "/bin/zsh"
	}

	if (process.platform === "linux") {
		// On Linux, SHELL is commonly the environment variable
		return env.SHELL || "/bin/bash"
	}
	return null
}

// -----------------------------------------------------
// 4) Publicly Exposed Shell Getter
// -----------------------------------------------------

export function getShell(): string {
	// 1. Check VS Code config first.
	if (process.platform === "win32") {
		// Special logic for Windows
		const windowsShell = getWindowsShellFromVSCode()
		if (windowsShell) {
			return windowsShell
		}
	} else if (process.platform === "darwin") {
		// macOS from VS Code
		const macShell = getMacShellFromVSCode()
		if (macShell) {
			return macShell
		}
	} else if (process.platform === "linux") {
		// Linux from VS Code
		const linuxShell = getLinuxShellFromVSCode()
		if (linuxShell) {
			return linuxShell
		}
	}

	// 2. If no shell from VS Code, try userInfo()
	const userInfoShell = getShellFromUserInfo()
	if (userInfoShell) {
		return userInfoShell
	}

	// 3. If still nothing, try environment variable
	const envShell = getShellFromEnv()
	if (envShell) {
		return envShell
	}

	// 4. Finally, fall back to a default
	if (process.platform === "win32") {
		// On Windows, if we got here, we have no config, no COMSPEC, and one very messed up operating system.
		// Use CMD as a last resort
		return SHELL_PATHS.CMD
	}
	// On macOS/Linux, fallback to a POSIX shell - This is the behavior of our old shell detection method.
	return SHELL_PATHS.FALLBACK
}
