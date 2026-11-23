const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 no-print">
      <span>SendIT Logistics Operations Center</span>
      <span>&copy; {new Date().getFullYear()} SendIT • Admin Portal v2.0</span>
    </footer>
  );
};

export default Footer;
