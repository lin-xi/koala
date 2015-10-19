set mapred.job.map.capacity=2000;
set mapred.job.reduce.capacity=300;
set mapred.job.priority=VERY_HIGH;
use namespace udw_ns;

insert overwrite table insight_lbs_panorama
partition(event_day='{DATE}')

SELECT TRIM(name) AS name, CAST(st_count AS int) AS st_count
from(
    from(
	    	SELECT
      		  --主站全景城市pv统计
				count(case when (event_urlparams["catalog"]="pano-city-visit") then "" end ) as st_map_pv,
      		  --主站全景城市uv统计
				count(distinct (case when (event_urlparams["catalog"]="pano-city-visit") then event_baiduid end )) as st_map_uv,
           --1.主图区十字标入口点击量
				count(case when (event_urlparams["catalog"]="tool" AND event_urlparams["code"]="10071") then "" end ) AS mapcontrol_tool_click, 
      		  --2. 外景：左侧检索列表点击量
				count(case when (event_urlparams["catalog"]="list" AND event_urlparams["func"]="click" AND event_urlparams['item']="street" AND event_urlparams["code"]="10071") then "" end ) AS mapsearchlist_click_street, 
      		  --3.外景：检索（poi、视野内）、底图可点、麻点气泡点击量
				count(case when (event_urlparams["catalog"]="poi" AND event_urlparams["from"]="infownd" AND event_urlparams['item']="street" AND event_urlparams["code"]="10071") then "" end ) AS mapinfownd_click_street, 
           --5.外景：运营位点击量
				count(case when (event_urlparams["catalog"]="index" AND event_urlparams["func"]="click" AND event_urlparams["code"]="10071") then "" end ) AS mapoperation_click, 
      		  --6.外景：检索列表入口-公交点击量
				count(case when (event_urlparams["from"]="search" AND event_urlparams["catalog"]="bus" AND event_urlparams["code"]="10070") then "" end ) AS mapsearchlist_bussearch_click, 
      		  --外景：公交中展开的步行
				count(case when (event_urlparams["from"]="search" AND event_urlparams["catalog"]="buswalk" AND event_urlparams["code"]="10070") then "" end )
					AS mapsearchlist_buswalksearch_click, 
           --7.外景：检索列表入口-步行点击量
				count(case when (event_urlparams["from"]="search" AND event_urlparams["catalog"]="walk" AND event_urlparams["code"]="10070") then "" end )
					AS mapsearchlist_walksearch_click, 
				--8. 外景：检索列表入口-驾车点击量
				count(case when (event_urlparams["from"]="search" AND event_urlparams["catalog"]="nav" AND event_urlparams["code"]="10070") then "" end )
					AS mapsearchlist_navsearch_click, 
            --9. 外景：检索列表入口-公交路线点击量(poi检索/公交中路线/线路详情)
				count(case when (event_urlparams["from"]="search" AND event_urlparams["catalog"]="busline" AND event_urlparams["code"]="10070") then "" end )
					AS mapsearchlist_buslinesearch_click,
            --10. 外景：检索列表入口-起终点设定点击量
				count(case when (event_urlparams["from"]="search" AND event_urlparams["catalog"]="routeaddr" AND event_urlparams["code"]="10070") then "" end )
					AS mapsearchlist_routeaddrsearch_click,
           --11. 外景：检索气泡入口-公交点击量
				count(case when (event_urlparams["from"]="infownd" AND event_urlparams["catalog"]="bus" AND event_urlparams["code"]="10070") then "" end )
					AS mapinfownd_bussearch_click, 
            --12. 外景：检索气泡入口-步行点击量
				count(case when (event_urlparams["from"]="infownd" AND event_urlparams["catalog"]="walk" AND event_urlparams["code"]="10070") then "" end )
					AS mapinfownd_walksearch_click,
            --13. 外景：检索气泡入口-驾车点击量
				count(case when (event_urlparams["from"]="infownd" AND event_urlparams["catalog"]="nav" AND event_urlparams["code"]="10070") then "" end )
					AS mapinfownd_navsearch_click,

				--14.外景：检索气泡入口-公交路线点击量
				count(case when (event_urlparams["from"]="infownd" AND event_urlparams["catalog"]="busline" AND event_urlparams["code"]="10070") then "" end )
					AS mapinfownd_buslinesearch_click, 
           --15. 外景：检索气泡入口-起终点设定点击量
				count(case when (event_urlparams["from"]="infownd" AND event_urlparams["catalog"]="routeaddr" AND event_urlparams["code"]="10070") then "" end )
					AS mapinfownd_routeaddrsearch_click, 
           --16.阿拉丁入口统计
				count(case when (event_urlparams["from"]="alamap" AND event_urlparams["catalog"]="alamap" AND event_urlparams["item"]="street" AND event_urlparams["code"]="10071") then "" end ) AS alamap_click_street, 
           --17.内景：检索（poi、视野内）、底图可点、麻点气泡点击量
				count(case when (event_urlparams["catalog"]="list" AND event_urlparams["func"]="click" AND event_urlparams["item"]="inter" AND event_urlparams["code"]="10071") then "" end ) AS mapinfownd_click_inter, 
      			--18.   内景：检索气泡点击量
				count(case when (event_urlparams["from"]="infownd" AND event_urlparams["catalog"]="poi" AND event_urlparams["item"]="inter" AND event_urlparams["code"]="10071") then "" end ) AS mapinfownd_poisearch_click_inter, 
				 --19.   全景的PV,
				count(case when ((event_urlparams["item"]="pano-whole" AND event_urlparams["code"]="10071") OR (event_urlparams["func"] ="enter" AND event_urlparams["code"]="10070")) then "pano_pv" end ) as pano_pv,
				count(distinct (case when ((event_urlparams["item"]="pano-whole" AND event_urlparams["code"]="10071") OR (event_urlparams["func"] ="enter" AND event_urlparams["code"]="10070")) then event_baiduid end ) ) 
					as pano_uv, --19.   全景的UV,
				count(case when (event_urlparams["item"]="pano-whole" AND event_urlparams["code"]="10071") then "pano_whole_pv" end )
					AS pano_whole_pv, --全景2.0的PV,
				count(distinct (case when (event_urlparams["item"]="pano-whole" AND event_urlparams["code"]="10071") then event_baiduid end ) )
					AS pano_whole_uv, --全景2.0的UV,
				count(case when (event_urlparams["item"]="indoorview-enter" AND event_urlparams["code"]="10071") then "pano_indoorview_pv" end )
					AS pano_indoorview_pv, --20.   内景的PV,
				count(distinct (case when (event_urlparams["item"]="indoorview-enter" AND event_urlparams["code"]="10071") then event_baiduid end ) )
					AS pano_indoorview_uv, --20.   内景的UV,
				count(distinct (case when ((event_urlparams["catalog"]="bus" OR event_urlparams["catalog"]="buswalk" OR event_urlparams["catalog"]="walk" OR event_urlparams["catalog"]="nav" OR event_urlparams["catalog"]="busline") AND event_urlparams["code"]="10070") then event_baiduid end ) )
					AS pano_navwalkbus_uv, --21.路线UV(驾车+步行+公交的UV), 无候选点routaddr

				count(case when (event_urlparams["catalog"]="map" AND event_urlparams["func"]="click" AND event_urlparams["item"]="street" AND event_urlparams["code"]="10071") then "mapnet_click_street" end )
					AS mapnet_click_street, --23. 路网进入外景点击量
				count(case when (event_urlparams["catalog"]="map" AND event_urlparams["func"]="click" AND event_urlparams["item"]="inter" AND event_urlparams["code"]="10071") then "mapnet_click_inter" end )
					AS mapnet_click_inter, --24. 路网小房子进入内景点击量

				--2.1统计
				count(case when (event_urlparams["item"]="panotimeline-click" AND event_urlparams["code"]="10071") then "panotimeline_click" end )
					AS panotimeline_click, --2.1.1.日夜景切换点击量
				count(case when (event_urlparams["item"]="poidetail-indoorview-click" AND event_urlparams["code"]="10071") then "poidetail_indoorview_click" end )
					AS poidetail_indoorview_click, --2.1.2.全景内Poi详情中内景入口点击量
				count(case when (event_urlparams["item"]="poilist-indoorview-click" AND event_urlparams["code"]="10071") then "poilist_indoorview_click" end )
					AS poilist_indoorview_click, --2.1.3. 全景内Poi列表内景入口点击量
				count(case when (event_urlparams["item"]="indoorview-exit-topo" AND event_urlparams["code"]="10071") then "indoorview_exit_topo" end )
					AS indoorview_exit_topo, --2.1.4.拓扑内景入口点击量
				count(case when (event_urlparams["item"]="streetview-bookmovie-click" AND event_urlparams["type"]="street" AND event_urlparams["code"]="10071") then "streetview_bookmovie_click" end )
					AS streetview_bookmovie_click, --2.1.5.电影预定点击量（外景）
				count(case when (event_urlparams["item"]="streetview-bookhotel-click" AND event_urlparams["type"]="street" AND event_urlparams["code"]="10071") then "streetview_bookhotel_click" end )
					AS streetview_bookhotel_click, --2.1.6.酒店预定点击量（外景）

				--2.2 统计
				count(case when (event_urlparams["item"]="classifysearchpanel-click" AND event_urlparams["code"]="10071") then "classifysearchpanel_click" end )
					AS classifysearchpanel_click, --2.2.1.分类检索面板点击量
				count(case when (event_urlparams["item"]="navalbum-click" AND event_urlparams["code"]="10071") then "navalbum_click" end )
					AS navalbum_click, --2.2.2.线路推荐位点击量 

				--2.3 统计
				count(case when (event_urlparams["item"]="streetview-bookmovie-click" AND event_urlparams["type"]="inter" AND event_urlparams["code"]="10071") then "indoorview_bookmovie_click" end )
					AS indoorview_bookmovie_click, --2.3.1 电影预定点击量(内景)
				count(case when (event_urlparams["item"]="streetview-bookhotel-click" AND event_urlparams["type"]="inter" AND event_urlparams["code"]="10071") then "indoorview_bookhotel_click" end )
					AS indoorview_bookhotel_click, --2.3.2 酒店预定点击量(内景)
                    
                --路线导航视频二维底图路线预览点击量
                count(case when (event_urlparams["item"]="pano-route-video-entrance" AND event_urlparams["from"]="map-search" AND event_urlparams["code"]="10071") then "panoRouteVideo_mapEntrance" end )
                 AS panoRouteVideo_mapEntrance, --二维底图路线预览点击量
                 
                 --路线导航视频驾车路线全景中路线预览点击量
                count(case when (event_urlparams["item"]="pano-route-video-entrance" AND event_urlparams["from"]="pano" AND event_urlparams["code"]="10071") then "panoRouteVideo_panoEntrance" end )
                 AS panoRouteVideo_panoEntrance, --驾车路线全景中路线预览点击量
                 
                 --路线导航视频pv
                 count(case when (event_urlparams["item"]="pano-route-video" AND event_urlparams["code"]="10071") then "panoRouteVideo_pv" end )
                 AS panoRouteVideo_pv, --路线导航视频PV统计
                 
                 --路线导航视频uv
                 count(distinct (case when (event_urlparams["item"]="pano-route-video"  AND event_urlparams["code"]="10071") then event_baiduid end )) 
                as panoRouteVideo_uv, --路线导航视频UV统计,
                
                 --路线导航播放时长
                 sum(case when (event_urlparams["item"]="pano-route-video-play-time"  AND event_urlparams["code"]="10071") then cast(event_urlparams["time"] as int) end) 
                as panoRouteVideo_playTime, --路线导航播放时长,
                    
                --全景主页高级版本PV统计
                count(case when (event_urlparams["item"]="panohome" AND event_urlparams["code"]="10079") then "panohome_pv" end )
                 AS panohome_pv, --全景主页高级版本PV统计
                
                --全景主页低级版本PV统计
                count(case when (event_urlparams["item"]="panohome_low" AND event_urlparams["code"]="10079") then "panohome_low_pv" end )
                 AS panohome_low_pv,  --全景主页低级版本PV统计
               
               --全景主页高级版本UV统计
               count(distinct (case when (event_urlparams["item"]="panohome" AND event_urlparams["code"]="10079") then event_baiduid end )) 
                as panohome_uv, --全景主页高级版本UV统计,
               
               --全景主页低级版本UV统计
               count(distinct (case when (event_urlparams["item"]="panohome_low" AND event_urlparams["code"]="10079") then event_baiduid end )) 
                as panohome_low_uv, --全景主页低级版本UV统计,
               
               --全景主页专题页pv    
               count(case when (event_urlparams["item"]="panohome_subjectpage" AND event_urlparams["code"]="10079") then "panohome_subjectpage" end ) 
               as panohome_subjectpage, --全景主页专题页pv,
               
               --全景主页头图切换点击次数    
               count(case when ((event_urlparams["item"]="panohome_head_click" AND event_urlparams["code"]="10079") OR (event_urlparams["item"] ="panohome_low_head_click" AND event_urlparams["code"]="10079")) then "panohome_head_change" end ) 
                as panohome_head_change, --全景主页头图切换点击次数,
               
               --全景主页专题页面显示次数    
               count(case when ((event_urlparams["item"]="panohome_subject_show" AND event_urlparams["code"]="10079") OR (event_urlparams["item"] ="'panohome_low_subject_show'" AND event_urlparams["code"]="10079")) then "panohome_subject_show" end ) 
               as panohome_subject_show, --全景主页专题页面显示次数,
               
               --全景主页圆点点击次数    
               count(case when ((event_urlparams["item"]="panohome_dot_click" AND event_urlparams["code"]="10079") OR (event_urlparams["item"] ="'panohome_low_dot_click'" AND event_urlparams["code"]="10079")) then "panohome_dot_click" end ) 
               as panohome_dot_click,  --全景主页圆点点击次数,
               
               --全景主页移动版pv统计 
                count(case when (event_urlparams["item"]="mobile_panohome" AND event_urlparams["code"]="10078") then "panohome_mobile_pv" end )
                 AS panohome_mobile_pv,  --全景主页移动版pv统计
                 
               --全景主页移动版uv统计
               count(distinct (case when (event_urlparams["item"]="mobile_panohome" AND event_urlparams["code"]="10078") then event_baiduid end )) 
                as panohome_mobile_uv, --全景主页低级版本UV统计,
                
                --全景主页移动版头部点击统计 
                count(case when (event_urlparams["item"]="mobile_panohome_head_click" AND event_urlparams["code"]="10078") then "panohome_mobile_head_click" end )
                 AS panohome_mobile_head_click,  --全景主页移动版头部点击统计
               
               --驾车搜索UV    
               count(distinct (case when (event_urlparams["item"]="panobatch" AND event_urlparams["code"]="10070" AND event_urlparams["catalog"]="nav" AND  event_urlparams["cityCode"] in ("224", "58", "131", "289", "340", "257")) then "nav_click" end )) 
               as nav_click,
               

                --uri_api
                count(case when (event_urlparams["item"]="uri_error_1" ) then "" end ) AS uri_error_1, 
                count(case when (event_urlparams["item"]="uri_error_3" ) then "" end ) AS uri_error_3, 
                count(case when (event_urlparams["item"]="uri_error_4" ) then "" end ) AS uri_error_4, 
                count(case when (event_urlparams["item"]="uri_error_5" ) then "" end ) AS uri_error_5, 
                count(case when (event_urlparams["item"]="uri_heading" ) then "" end ) AS uri_heading,
                count(case when (event_urlparams["item"]="uri_pitch" ) then "" end ) as uri_pitch,
                count(case when (event_urlparams["item"]="uri_hide_navigationControl") then "" end ) AS uri_hide_navigationControl,
                count(case when (event_urlparams["item"]="uri_hide_linkControl" ) then "" end ) AS uri_hide_linkControl,
                count(case when (event_urlparams["item"]="uri_hide_albumsControl") then "" end ) AS uri_hide_albumsControl,
                
                count(case when (event_urlparams["item"]="uri_pid" ) then "" end ) AS uri_pid,
                count(case when (event_urlparams["item"]="uri_uid" ) then "" end ) AS uri_uid,
                count(case when (event_urlparams["item"]="uri_lnglat" ) then "" end ) AS uri_lnglat,
                count(case when (event_urlparams["item"]="uri_pv") then "" end ) AS uri_pv,
                count(case when (event_urlparams["item"]="uri_pv" AND event_urlparams["ua"]="pc") then "" end ) AS uri_pc_pv,
                count(distinct (case when (event_urlparams["item"]="pano_render_webgl") then event_baiduid end )) AS pano_render_webgl,
                count(distinct (case when (event_urlparams["item"]="pano_render_flash") then event_baiduid end )) AS pano_render_flash,
					  count(case when (event_urlparams["item"]="guide_album_click" and event_urlparams["type"] in ("9", "10")) then "" end ) AS video_from_guide,
                count(case when (event_urlparams["item"]="video.action.play" or event_urlparams["item"]="video_action_play") then "" end ) AS video_action_play,
                count(case when (event_urlparams["item"]="video.action.share") then "" end ) AS video_action_share,
                count(case when (event_urlparams["item"]="video.action.pause") then "" end ) AS video_action_pause,
                count(case when (event_urlparams["item"]="video.action.fullscreen") then "" end ) AS video_action_fullscreen,
                count(case when (event_urlparams["item"]="video.action.close") then "" end ) AS video_action_close,
      				 count(case when (event_urlparams["item"]="zoom-out-click") then "" end ) AS zoom_out_click,
                count(case when (event_urlparams["item"]="zoom-in-click") then "" end ) AS zoom_in_click,
                count(case when (event_urlparams["item"]="zoom-button-click") then "" end ) AS zoom_button_click,             
                count(case when (event_urlparams["item"]="pano-share-click") then "" end ) AS pano_share_click,  	--分享按钮
                
                count(case when (event_urlparams["item"]="share.marker.revert") then "" end ) AS share_marker_revert,
                count(case when (event_urlparams["item"]="share.marker.add") then "" end ) AS share_marker_add,             
                count(case when (event_urlparams["item"]="share.marker.edit") then "" end ) AS share_marker_edit,
                count(case when (event_urlparams["item"]="share.link.copy") then "" end ) AS share_link_copy,             
                count(case when (event_urlparams["item"]="share.link.open") then "" end ) AS share_link_open,
                count(case when (event_urlparams["item"]="mousewheel-raodnet-open") then "" end ) AS mousewheel_raodnet_open, --滚轮打开路网
                --内景版权链接统计
                count(case when (event_urlparams["item"]="indoor_biz_link_click") then "" end ) AS indoor_biz_link_click, 
                --商业化内景详情处商户链接点击量
                count(case when (event_urlparams["item"]="indoor_info_biz_link_click") then "" end ) AS indoor_info_biz_link_click,
                --商业化内景弹窗标注点击量
                count(case when (event_urlparams["item"]="indoor_biz_marker_dlg_click") then "" end) AS indoor_biz_marker_dlg_click,
                --商业化内景拓扑标注点击量
                count(case when (event_urlparams["item"]="indoor_biz_marker_topo_click") then "" end) AS indoor_biz_marker_topo_click,
                --商业化内景跳转标注点击量
                count(case when (event_urlparams["item"]="indoor_biz_marker_jump_click") then "" end) AS indoor_biz_marker_jump_click,
                --亿万像素PV、UV
                count(case when (event_urlparams["item"]="billion-pixels-enter") then "" end) AS billion_pixels_enter,
                --亿万像素分享点击统计
                count(case when (event_urlparams["item"]="billion-pixels-share-click") then "" end) AS billion_pixels_share_click,
                --亿万像素最大图点击统计
                count(case when (event_urlparams["item"]="billion-pixels-max-zoom-click") then "" end) AS billion_pixels_max_zoom_click,
                --亿万像素最小图点击统计
                count(case when (event_urlparams["item"]="billion-pixels-min-zoom-click") then "" end) AS billion_pixels_min_zoom_click,
                --全景预览菜单项点击量统计
                count(case when (event_urlparams["item"]="pano-preview-click") then "" end) AS pano_preview_click,
                --由全景预览进入全景PV、UV统计
                count(case when (event_urlparams["item"]="pano-enter-from-preview") then "" end) AS pano_enter_from_preview
			FROM udwetl_lbscode
			WHERE event_day='{DATE}' AND
				--event_product="map" AND 
				--event_entrance_type="pc" AND
				(event_urlparams["code"] in ("10071", "10070", "10079", "10078")) 
      

		) tmp_table
    map 
    	st_map_pv, st_map_uv, mapcontrol_tool_click, mapsearchlist_click_street, mapinfownd_click_street, mapoperation_click, mapsearchlist_bussearch_click, mapsearchlist_buswalksearch_click, mapsearchlist_walksearch_click,
    	mapsearchlist_navsearch_click, mapsearchlist_buslinesearch_click, mapsearchlist_routeaddrsearch_click, mapinfownd_bussearch_click, mapinfownd_walksearch_click, mapinfownd_navsearch_click,
    	mapinfownd_buslinesearch_click, mapinfownd_routeaddrsearch_click, alamap_click_street, mapinfownd_click_inter, mapinfownd_poisearch_click_inter, 
    	pano_pv, pano_uv, pano_whole_pv, pano_whole_uv, pano_indoorview_pv, pano_indoorview_uv, pano_navwalkbus_uv,
    	mapnet_click_street, mapnet_click_inter,
    	panotimeline_click, poidetail_indoorview_click, poilist_indoorview_click, indoorview_exit_topo, streetview_bookmovie_click, streetview_bookhotel_click,
    	classifysearchpanel_click, navalbum_click,
    	indoorview_bookmovie_click, indoorview_bookhotel_click,
        panoRouteVideo_mapEntrance, panoRouteVideo_panoEntrance,panoRouteVideo_pv, panoRouteVideo_uv, panoRouteVideo_playTime,
        panohome_pv, panohome_low_pv, panohome_uv, panohome_low_uv, panohome_subjectpage, panohome_head_change, panohome_subject_show, panohome_dot_click, panohome_mobile_pv, panohome_mobile_uv, panohome_mobile_head_click,
        nav_click,
        uri_error_1,uri_error_3,uri_error_4,uri_error_5,uri_heading,uri_pitch,uri_hide_navigationControl,uri_hide_linkControl,uri_hide_albumsControl,
        uri_pid,uri_uid,uri_lnglat,uri_pv,uri_pc_pv,
        pano_render_webgl,pano_render_flash,
        video_from_guide, video_action_play, video_action_share, video_action_pause, video_action_fullscreen, video_action_close,
        zoom_out_click,zoom_in_click,zoom_button_click,
        pano_share_click,
        share_marker_revert,share_marker_add,share_marker_edit,share_link_copy,share_link_open,
        mousewheel_raodnet_open,
        indoor_biz_link_click,
        indoor_info_biz_link_click,
        indoor_biz_marker_dlg_click,
        indoor_biz_marker_topo_click,
        indoor_biz_marker_jump_click,
        billion_pixels_enter,
        billion_pixels_share_click,
        billion_pixels_max_zoom_click,
        billion_pixels_min_zoom_click,
        pano_preview_click,
        pano_enter_from_preview
        
     	using '/home/sharelib/python/bin/python panorama_row2col.py'
    AS name, st_count
)
result