DROP EVENT IF EXISTS `sauvegarde`;
  CREATE EVENT `sauvegarde`
  ON SCHEDULE EVERY 1 DAY STARTS '2014-05-02 00:00:01' 
  ON COMPLETION NOT PRESERVE ENABLE 
  COMMENT 'Sauvegarde des horaires passés.' 
  DO -- Sauvegarde des horaires antérieures à aujourd'hui
    call sauvegarde()