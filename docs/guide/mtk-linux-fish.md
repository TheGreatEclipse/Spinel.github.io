### No MIUI Tool · Full Backup · Clean Flash · Error Recovery · Rollback

> **Platform:** Linux with **Fish shell** — all commands are Fish-compatible.
> Fish uses different syntax from Bash for variables, pipes, and conditionals.

---

> ⚠️ **Warning:** This process **wipes all data** and may void your warranty.
> Take a full backup before proceeding. You assume all responsibility.

---

## Table of Contents

- [Phase 1 — Prerequisites & Full Backup](#phase-1--prerequisites--full-backup)
- [Phase 2 — BROM Mode & Bootloader Unlock (no MIUI tool)](#phase-2--brom-mode--bootloader-unlock-no-miui-tool)
- [Phase 3 — Clean ROM Flash](#phase-3--clean-rom-flash)
  - [Method A — SP Flash Tool](#method-a--sp-flash-tool-stock-rom)
  - [Method B — MTKClient Direct](#method-b--mtkclient-direct)
- [Phase 4 — Error Recovery & vbmeta Bypass](#phase-4--error-recovery--vbmeta-bypass)
- [Phase 5 — Full Rollback / Relock](#phase-5--full-rollback--relock)
- [Troubleshooting Guide — Bootloop, Soft Brick & Hard Brick](#troubleshooting-guide--bootloop-soft-brick--hard-brick)

> 💡 **Note on Xiaomi Flash Tool (MiFlash):** MiFlash is Windows-only.
> On Linux, use SP Flash Tool or MTKClient Direct for ROM flashing.

---

## Fish Shell Quick Reference

Key differences from Bash you'll encounter in this guide:

| Task | Bash | Fish |
|------|------|------|
| Set a variable | `export VAR=value` | `set -x VAR value` |
| Use a variable | `$VAR` | `$VAR` *(same)* |
| Command substitution | `$(cmd)` | `(cmd)` |
| Pipe | `cmd1 \| cmd2` | `cmd1 \| cmd2` *(same)* |
| Run as root | `sudo cmd` | `sudo cmd` *(same)* |
| And operator | `cmd1 && cmd2` | `cmd1; and cmd2` |

---

## Phase 1 — Prerequisites & Full Backup

### Step 1 — Install Python 3.x

Check your version:

```fish
python3 --version
```

If missing, install via your package manager:

```fish
# Debian / Ubuntu
sudo apt install python3 python3-pip

# Fedora
sudo dnf install python3 python3-pip

# Arch
sudo pacman -S python python-pip
```

---

### Step 2 — Install System Dependencies

```fish
# Debian / Ubuntu
sudo apt install python3-dev libusb-1.0-0-dev libudev-dev git

# Fedora
sudo dnf install python3-devel libusb-devel systemd-devel git

# Arch
sudo pacman -S libusb udev git
```

---

### Step 3 — Set Up udev Rules *(replaces UsbDk on Windows)*

On Linux, UsbDk is not needed. Instead, set udev rules so MTKClient can access the USB device without root:

```fish
echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="0e8d", MODE="0666", GROUP="plugdev"' | sudo tee /etc/udev/rules.d/99-mtk.rules
sudo udevadm control --reload-rules
sudo udevadm trigger
sudo usermod -aG plugdev $USER
```

> ⚠️ **Log out and back in** after adding yourself to `plugdev` for the change to take effect.

Verify your group membership:

```fish
groups | string match -r plugdev
```

---

### Step 4 — Clone and Install MTKClient

```fish
git clone https://github.com/bkerler/mtkclient
cd mtkclient
pip3 install -r requirements.txt
python3 setup.py install
```

> 📥 **Note:** You can get this from **[github.com/bkerler/mtkclient](https://github.com/bkerler/mtkclient)**

Set your working directory for the session:

```fish
set -x MTK_DIR ~/mtkclient
cd $MTK_DIR
```

> 💡 Add that `set -x MTK_DIR` line to `~/.config/fish/config.fish` so it persists across sessions.

---

### Step 5 — Install ADB & Fastboot

```fish
# Debian / Ubuntu
sudo apt install adb fastboot

# Fedora
sudo dnf install android-tools

# Arch
sudo pacman -S android-tools
```

Verify:

```fish
adb version; and fastboot --version
```

---

### Step 6 — Back Up Critical Partitions *(your undo image)*

| Partition | Why it matters |
|-----------|---------------|
| `preloader` | Lowest-level bootloader — corrupted = hard brick |
| `seccfg` | Stores the bootloader lock state — modified during unlock |
| `nvram` | IMEI, Wi-Fi / BT MAC, antenna calibration — lose this = no signal |
| `nvdata` | Companion to nvram, modem config |
| `persist` | DRM keys, fingerprint calibration data |
| `boot` | Android kernel — needed if boot gets corrupted mid-flash |
| `vendor` | HAL and driver blobs — system won't boot without a matching vendor |

Boot your device to BROM mode first *(see Phase 2, Step 1)*, then run:

```fish
python3 mtk.py rl backup_folder --skip-xml --parttype=preloader,seccfg,nvram,nvdata,persist,boot,vendor
```

> ✅ **Result: ~500 MB to 2 GB total, done in under 5 minutes.**
> Keep this folder somewhere safe — it is your complete rollback if anything goes wrong.

To restore a single partition if needed (e.g. only `seccfg` got corrupted):

```fish
python3 mtk.py w seccfg,backup_folder/seccfg.bin
```

Create a timestamped backup folder to keep multiple snapshots:

```fish
set backup_dir backup_(date +%Y%m%d_%H%M%S)
python3 mtk.py rl $backup_dir --skip-xml --parttype=preloader,seccfg,nvram,nvdata,persist,boot,vendor
echo "Backup saved to: $backup_dir"
```

---

## Phase 2 — BROM Mode & Bootloader Unlock (no MIUI tool)

### Step 1 — Boot Device into BROM Mode

Power off the device completely. Try one of the following while plugging in USB:

| Option | Key Combination |
|--------|----------------|
| A | Hold **Volume Down** → plug USB |
| B | Hold **Volume Up + Volume Down** → plug USB |
| C | Hold **Volume Up + Volume Down + Power** → plug USB |
| D *(no buttons)* | Remove battery briefly → plug USB |

**To confirm BROM mode** — check `dmesg` immediately after connecting:

```fish
sudo dmesg | tail -20
```

Look for lines mentioning `MediaTek` or `idVendor=0e8d`. Check USB devices:

```fish
lsusb | grep -i mediatek
```

Then confirm MTKClient can see the device:

```fish
python3 mtk.py printgpt
```

If it responds with partition info, you're in BROM.

---

### Step 2 — Bypass Authentication *(replaces MIUI unlock tool)*

MTKClient handles auth bypass internally — no Mi account or waiting period needed.
If you get an auth error, run:

```fish
python3 mtk.py payload
```

> 💡 Reconnect in BROM mode after the payload completes.

---

### Step 3 — Wipe Metadata & Userdata

Required before unlocking. **This erases all user data:**

```fish
python3 mtk.py e metadata,userdata,md_udc
```

---

### Step 4 — Reconnect to BROM, then Unlock Bootloader

Power off and re-enter BROM mode. Then run *(try in order)*:

```fish
python3 mtk.py xflash seccfg unlock
```

If the above fails:

```fish
python3 mtk.py da seccfg unlock
```

> ✅ **Bootloader is now unlocked.**
> Boot to the OS once to let Android initialise the unlocked state, then proceed to flash your ROM.

---

## Phase 3 — Clean ROM Flash

> 💡 MiFlash (Xiaomi Flash Tool) is **Windows-only**. On Linux, use SP Flash Tool or MTKClient Direct.

| Method | Best for |
|--------|----------|
| **A — SP Flash Tool** | Any MTK device, stock scatter-based ROMs |
| **B — MTKClient Direct** | Flashing individual partition images |

---

### Method A — SP Flash Tool *(stock ROM)*

#### Step 1 — Download SP Flash Tool for Linux

> 📥 **Note:** You can get this file from **[spflashtool.com](https://spflashtool.com)** — download the Linux version (`.tar.gz`)

#### Step 2 — Extract and run

```fish
tar -xzf SP_Flash_Tool_*.tar.gz
cd SP_Flash_Tool_*/
chmod +x flash_tool
./flash_tool
```

#### Step 3 — Flash

1. Load `scatter.txt` from your ROM folder
2. Select **Download Only**
3. Click **Download**
4. Power off phone → connect via USB cable

> ⚠️ **Do not flash the `preloader` partition** — uncheck it in the scatter file to avoid a hard brick.

---

### Method B — MTKClient Direct

Flash individual partition images in BROM mode:

```fish
python3 mtk.py w boot,boot.img
python3 mtk.py w system,system.img
python3 mtk.py w vendor,vendor.img
```

Flash multiple partitions in one go using a Fish loop:

```fish
for part in boot system vendor
    python3 mtk.py w $part,(echo $part).img
    and echo "$part flashed successfully"
    or echo "Failed to flash $part"
end
```

---

### First Boot *(all methods)*

> ⏳ First boot after a clean flash can take **5–15 minutes**. Do not interrupt it.

---

## Phase 4 — Error Recovery & vbmeta Bypass

### Error: `dm-verity corruption` / Bootloop after Flash

```fish
fastboot --disable-verity --disable-verification flash vbmeta vbmeta.img
fastboot reboot
```

> 📥 **Note:** You can get `vbmeta.img` from your ROM zip or from your `backup_folder`

---

### Error: Xiaomi-specific `cdms` / dm-verity after Unlock

```fish
fastboot oem cdms
fastboot reboot
```

---

### Error: Stuck in Bootloop — Flash Recovery First

```fish
python3 mtk.py w recovery,twrp.img
```

> 📥 **Note:** You can get TWRP from **[twrp.me/Devices](https://twrp.me/Devices)** or your device's XDA thread

---

### Error: MTKClient Auth Failure / `Brom Exception`

Diagnose on Linux with Fish:

```fish
# Check if device is visible at all
lsusb | grep -i mediatek

# Check kernel messages
sudo dmesg | tail -30 | grep -i usb

# Check permissions on the USB device
set mtk_bus (lsusb | grep -i mediatek | string match -r 'Bus (\d+)' | tail -1)
ls -la /dev/bus/usb/$mtk_bus/
```

If permissions are wrong, re-apply udev rules *(Phase 1, Step 3)* then log out and back in.

---

### Nuclear Option — Full Restore from Backup

```fish
python3 mtk.py wl backup_folder
```

> 🔴 **Restores everything including the locked bootloader state.**

---

## Phase 5 — Full Rollback / Relock

### Step 1 — Prepare Device for Relock

- Flash stock ROM
- Unroot (remove Magisk or reflash stock boot)
- Restore stock recovery

> ⚠️ **Back up your data** — relocking wipes the device again.

---

### Step 2 — Boot to BROM Mode and Relock

```fish
python3 mtk.py xflash seccfg lock
```

Or if you used the `da` method:

```fish
python3 mtk.py da seccfg lock
```

---

### Step 3 — Full Backup Restore *(alternative rollback)*

```fish
python3 mtk.py wl backup_folder
```

> ✅ **Rollback complete. Device restored to original state including locked bootloader.**

---

## Troubleshooting Guide — Bootloop, Soft Brick & Hard Brick

### How to tell which state you're in

| Symptom | What it is |
|---------|-----------|
| Phone restarts repeatedly, never reaches home screen | **Bootloop** |
| Stuck on logo / black screen but responds to button combos or ADB | **Soft Brick** |
| No screen, no vibration, not detected by PC at all | **Hard Brick** |

---

### 🔁 Bootloop

**Step 1 — Try entering recovery manually**
Power off → hold **Volume Up + Power** until recovery appears.

**Step 2 — Disable vbmeta verification**

```fish
fastboot --disable-verity --disable-verification flash vbmeta vbmeta.img
fastboot reboot
```

**Step 3 — Flash boot partition only**

```fish
python3 mtk.py w boot,backup_folder/boot.bin
```

**Step 4 — Full clean flash**
Use SP Flash Tool or MTKClient Direct *(see Phase 3)*.

**Step 5 — Restore critical partitions from backup**

```fish
for part in seccfg boot vendor
    python3 mtk.py w $part,backup_folder/(echo $part).bin
    and echo "Restored $part"
    or echo "Failed to restore $part"
end
```

---

### 🟡 Soft Brick

**Step 1 — Confirm BROM access**

```fish
python3 mtk.py printgpt
```

**Step 2 — Restore seccfg**

```fish
python3 mtk.py w seccfg,backup_folder/seccfg.bin
```

**Step 3 — Restore nvram / nvdata *(no signal / null IMEI)***

```fish
python3 mtk.py w nvram,backup_folder/nvram.bin
python3 mtk.py w nvdata,backup_folder/nvdata.bin
```

> ⚠️ **Never flash someone else's nvram.** Using another device's IMEI is illegal in most countries.

**Step 4 — Flash TWRP and reflash ROM**

```fish
python3 mtk.py w recovery,twrp.img
```

Boot into TWRP → Advanced Wipe → System, Data, Cache, Dalvik → flash ROM zip.

**Step 5 — Full partition restore**

```fish
python3 mtk.py wl backup_folder
```

---

### 🔴 Hard Brick

**Step 1 — Rule out the obvious**

```fish
# Check if anything is detected
lsusb
sudo dmesg | tail -30

# Watch for new USB devices in real time as you connect
sudo udevadm monitor --udev --subsystem-match=usb
```

- Try a different USB cable, different port, different machine
- Charge for 30 minutes — dead battery won't enter BROM

**Step 2 — Try BROM without battery *(removable only)***
Remove battery, connect USB only — chip may enter BROM from USB power alone.

**Step 3 — Try SP Flash Tool**
Open SP Flash Tool for Linux → load scatter → click Download → connect powered-off device.

**Step 4 — Short the test point *(advanced)*

> 📥 **Note:** You can find the test point location for your device on **[gsmforum.net](https://gsmforum.net)** or XDA — search `[your model] test point`

Once detected via test point:

```fish
python3 mtk.py w preloader,backup_folder/preloader.bin
```

**Step 5 — Hardware repair**
- **ISP:** Shop reads/writes eMMC directly — recoverable
- **eMMC swap:** Last resort, data lost

> 💡 Bring your `backup_folder` to the shop — they can restore your IMEI from `nvram.bin`.

---

*Guide compiled from MTKClient documentation and community-sourced methods.
Always verify commands against the latest MTKClient release notes on GitHub.*
