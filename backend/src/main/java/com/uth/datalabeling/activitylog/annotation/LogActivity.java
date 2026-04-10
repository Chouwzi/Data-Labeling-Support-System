package com.uth.datalabeling.activitylog.annotation;


import java.lang.annotation.*;


@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface LogActivity {


    String action();


    String description() default "";


    String entityType() default "";
}


