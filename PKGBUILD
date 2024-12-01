pkgname=("fontconfig-envision" "freetype-envision-normal" "freetype-envision-full")
pkgver=0.6.0
pkgrel=1
arch=('any')
source=(
  "https://github.com/maximilionus/freetype-envision/releases/download/v${pkgver}/freetype-envision-${pkgver}.tar.gz"
)
md5sums=('SKIP')
makedepends=('tar')

folder_name="freetype-envision-${pkgver}"

build() {
  cd "$srcdir/$folder_name"
  ls
}

check() {
  cd "$srcdir/$folder_name"
  ls
}

package_fontconfig-envision() {
  depends=("fontconfig")

  fontconfig_conf_dir="$pkgdir/etc/fonts/conf.d"
  fontconfig_install_dir="$pkgdir/etc/fonts/conf.avail"

  cd "$srcdir/$folder_name"

  files=(
    freetype-envision-grayscale.conf
    freetype-envision-droid-sans.conf
  )

  # Make sure the directories exists
  install -d $fontconfig_install_dir
  install -d $fontconfig_conf_dir

  for file in ${files[@]}; do
    # Install the configuration file to /etc/fonts/conf.avail
    install -m 644 fontconfig/$file $fontconfig_install_dir/00-$file

    # Create the symbolic link to /etc/fonts/conf.d
    ln -s $fontconfig_install_dir/00-$file $fontconfig_conf_dir/00-$file
  done
  #./freetype-envision.sh install
}

package_freetype-envision-normal() {
  depends=("freetype2" "fontconfig-envision")
  backup=(etc/profile.d/freetype2.sh)
  conflicts=("freetype-envision-full")

  cd "$srcdir/$folder_name"
  profile_install_dir="$pkgdir/etc/profile.d"

  install -d $profile_install_dir
  install -m 644 profile.d/freetype-envision-normal.sh $profile_install_dir/freetype2.sh
}

package_freetype-envision-full() {
  profile_install_dir="$pkgdir/etc/profile.d"
  backup=(etc/profile.d/freetype2.sh)
  conflicts=("freetype-envision-normal")

  cd "$srcdir/$folder_name"
  profile_install_dir="$pkgdir/etc/profile.d"

  install -d $profile_install_dir
  install -m 644 profile.d/freetype-envision-normal.sh $profile_install_dir/freetype2.sh
}

