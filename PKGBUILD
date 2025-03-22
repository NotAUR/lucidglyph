pkgname=("lucidglyph")
pkgver=0.9.1
pkgrel=1
arch=('any')
source=(
  "git+https://github.com/maximilionus/lucidglyph#tag=v$pkgver"
  "0001-Add-support-for-DESTDIR-environment-variable.patch"
  "0002-Add-support-for-changing-DEST_ENVIRONMENT-environmen.patch"
)
validpgpkeys=(
  "B7E510C142B88F4B"
)
md5sums=('SKIP' 'SKIP' "SKIP")
sha512sums=(
  'SKIP'
  '55841abd90118e0e04f4fdaef72076e6b91c519172516bb9a88c2866a7f87eaae564a125af1effe933cb9fccad9c4b56e2d9503dc46ddd131ff6f9fd0fc39031' # 0001-Add-support-for-DESTDIR-environment-variable.patch
  '83d12bd1bcd12f4d36a1e8db69a7008c670cfad2ae08f4e8cef68c9d62bc86f2e986a222895dba270693285e240201c65792048d0ddf2e8185ca53162da9eeda' # 0002-Add-support-for-changing-DEST_ENVIRONMENT-environmen.patch
)
makedepends=('git')
depends=(
  "fontconfig"
  "pam"
  "freetype2"
)
provides=(
  "lucidglyph"
  "fontconfig-envision"
  "freetype-envision-normal"
  "freetype-envision-full"
)
replaces=(
  "lucidglyph"
  "fontconfig-envision"
  "freetype-envision-normal"
  "freetype-envision-full"
)
license=("GPL")
url="https://github.com/maximilionus/lucidglyph"
folder_name="lucidglyph"

build() {
  cd "$srcdir/$folder_name" || exit 1

  local patch_files
  patch_files=(
    "$srcdir/0001-Add-support-for-DESTDIR-environment-variable.patch"
    "$srcdir/0002-Add-support-for-changing-DEST_ENVIRONMENT-environmen.patch"
  )

  for patch_file in "${patch_files[@]}"; do
    patch -p1 < "$patch_file" || exit 1
  done
}

check() {
  cd "$srcdir/$folder_name" || exit 1
  ls
}

package() {
  cd "$srcdir/$folder_name" || exit 1

  # Create directories on `$pkgdir`
  local directories
  directories=(
    "/etc"
    "/etc/environment.d"
    "/etc/fonts/conf.d"
    "/usr/share/lucidglyph"
  )

  local lucid_glyph_environment_file
  lucid_glyph_environment_file="/etc/environment.d/lucidglyph.conf"

  local files
  files=(
    "$lucid_glyph_environment_file"
  )

  local install_args
  install_args=()

  # Create directories
  for directory in "${directories[@]}"; do
    install_args=(
      --verbose --mode=755 --directory "$pkgdir/$directory"
    )
    install "${install_args[@]}" || exit 1
  done

  # Create files
  for file in "${files[@]}"; do
    install_args=(
      --verbose
      --mode=644
      # create all leading components of DEST except the last,
      # or all components of --target-directory, then copy SOURCE to DEST
      -D
      /dev/null
      "$pkgdir/$file"
    )
    install "${install_args[@]}" || exit 1
  done

  env DESTDIR="$pkgdir" DEST_ENVIRONMENT="$pkgdir/$lucid_glyph_environment_file" bash ./lucidglyph.sh install || exit 1

  # Clean up
  local clean_files
  clean_files=(
    # Remove the `uninstaller.sh`, we do not need it since we're using ALPM
    "$pkgdir/usr/share/lucidglyph/uninstaller.sh"
  )

  for clean_file in "${clean_files[@]}"; do
    rm --verbose "$clean_file" || exit 1
  done
}
